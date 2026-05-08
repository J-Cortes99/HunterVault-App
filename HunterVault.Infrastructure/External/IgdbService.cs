using System.Text;
using System.Text.Json;
using HunterVault.Application.Abstractions.External;
using HunterVault.Application.Abstractions.Time;
using HunterVault.Application.Configuration;
using HunterVault.Application.Dtos.Igdb;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace HunterVault.Infrastructure.External;

public class IgdbService : IIgdbService
{
    private static readonly int[] MainGameCategories = [0, 8, 9, 10, 11];
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly HttpClient _httpClient;
    private readonly ILogger<IgdbService> _logger;
    private readonly IMemoryCache _cache;
    private readonly IClock _clock;
    private readonly IgdbOptions _options;

    private readonly SemaphoreSlim _tokenSemaphore = new(1, 1);
    private string? _accessToken;
    private DateTime _tokenExpiration;

    public IgdbService(
        HttpClient httpClient,
        IOptions<IgdbOptions> options,
        ILogger<IgdbService> logger,
        IMemoryCache cache,
        IClock clock)
    {
        _httpClient = httpClient;
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "HunterVault-Api");
        _options = options.Value;
        _logger = logger;
        _cache = cache;
        _clock = clock;
    }

    public async Task<IReadOnlyList<IgdbSearchResultDto>> SearchGamesAsync(string query, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query))
            return Array.Empty<IgdbSearchResultDto>();

        var cacheKey = $"igdb_search_{query.ToLower().Trim()}";
        if (_cache.TryGetValue(cacheKey, out IReadOnlyList<IgdbSearchResultDto>? cached) && cached is not null)
        {
            _logger.LogInformation("Serving search results from cache for: {Query}", query);
            return cached;
        }

        try
        {
            await EnsureAccessTokenAsync(cancellationToken);
            if (string.IsNullOrEmpty(_accessToken))
                return Array.Empty<IgdbSearchResultDto>();

            var safeName = query.Replace("\"", "\\\"");
            using var request = BuildIgdbRequest(
                "https://api.igdb.com/v4/games",
                $"search \"{safeName}\"; fields id, name, cover.url, category; limit 15;");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
                return Array.Empty<IgdbSearchResultDto>();

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var games = JsonSerializer.Deserialize<List<IgdbGameResponse>>(content, JsonOptions) ?? [];

            var result = games
                .Where(g => MainGameCategories.Contains(g.Category))
                .GroupBy(g => g.Name)
                .Select(grp => grp.First())
                .Take(8)
                .Select(g => new IgdbSearchResultDto(
                    g.Id,
                    g.Name,
                    g.Cover is null ? null : ProcessCoverUrl(g.Cover.Url)))
                .ToList();

            _cache.Set(cacheKey, (IReadOnlyList<IgdbSearchResultDto>)result, TimeSpan.FromMinutes(15));
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching IGDB for game: {Query}", query);
            return Array.Empty<IgdbSearchResultDto>();
        }
    }

    public async Task<IgdbGameDetailsDto?> GetFullGameDetailsByIdAsync(int igdbId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"igdb_details_{igdbId}";
        if (_cache.TryGetValue(cacheKey, out IgdbGameDetailsDto? cached))
        {
            _logger.LogInformation("Cache hit for IGDB game {IgdbId}", igdbId);
            return cached;
        }

        try
        {
            await EnsureAccessTokenAsync(cancellationToken);
            if (string.IsNullOrEmpty(_accessToken)) return null;

            using var request = BuildIgdbRequest(
                "https://api.igdb.com/v4/games",
                $"where id = {igdbId}; fields id, name, summary, cover.url, genres.name, platforms.name, first_release_date, rating, screenshots.url, videos.video_id, category; limit 1;");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode) return null;

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var games = JsonSerializer.Deserialize<List<IgdbGameResponse>>(content, JsonOptions);
            var game = games?.FirstOrDefault();
            if (game is null) return null;

            var dto = new IgdbGameDetailsDto
            {
                Id = game.Id,
                Name = game.Name,
                Summary = game.Summary,
                CoverUrl = game.Cover is null ? null : ProcessCoverUrl(game.Cover.Url).Replace("t_cover_big", "t_1080p"),
                Rating = game.Rating,
                FirstReleaseDate = game.FirstReleaseDate,
                Genres = game.Genres?.Select(g => g.Name).ToList() ?? new(),
                Platforms = game.Platforms?.Select(p => p.Name).ToList() ?? new(),
                Screenshots = game.Screenshots?.Select(s => ProcessCoverUrl(s.Url).Replace("t_cover_big", "t_1080p")).ToList() ?? new(),
                TrailerYoutubeId = game.Videos?.FirstOrDefault()?.VideoId
            };

            await PopulateTimeToBeatAsync(dto, cancellationToken);

            _cache.Set(cacheKey, dto, TimeSpan.FromHours(24));
            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving full details by ID {IgdbId}", igdbId);
            return null;
        }
    }

    private async Task PopulateTimeToBeatAsync(IgdbGameDetailsDto dto, CancellationToken cancellationToken)
    {
        try
        {
            using var request = BuildIgdbRequest(
                "https://api.igdb.com/v4/game_time_to_beats",
                $"where game_id = {dto.Id}; fields *;");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode) return;

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var ttb = JsonSerializer.Deserialize<List<IgdbTimeToBeatResponse>>(content, JsonOptions)?.FirstOrDefault();
            if (ttb is null) return;

            dto.Normally = ttb.Normally;
            dto.Hastily = ttb.Hastily;
            dto.Completely = ttb.Completely;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not fetch Time to Beat for game ID {GameId}", dto.Id);
        }
    }

    private HttpRequestMessage BuildIgdbRequest(string url, string body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Client-ID", _options.ClientId);
        request.Headers.Add("Authorization", $"Bearer {_accessToken}");
        request.Content = new StringContent(body, Encoding.UTF8, "text/plain");
        return request;
    }

    private async Task EnsureAccessTokenAsync(CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(_accessToken) && _clock.UtcNow < _tokenExpiration) return;

        await _tokenSemaphore.WaitAsync(cancellationToken);
        try
        {
            if (!string.IsNullOrEmpty(_accessToken) && _clock.UtcNow < _tokenExpiration) return;

            if (string.IsNullOrEmpty(_options.ClientId) || string.IsNullOrEmpty(_options.ClientSecret))
            {
                _logger.LogError("IGDB credentials are missing in configuration.");
                return;
            }

            var url = $"https://id.twitch.tv/oauth2/token?client_id={_options.ClientId}&client_secret={_options.ClientSecret}&grant_type=client_credentials";
            var response = await _httpClient.PostAsync(url, null, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to retrieve IGDB access token. Status: {StatusCode}", response.StatusCode);
                return;
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var auth = JsonSerializer.Deserialize<TwitchAuthResponse>(content);
            if (auth is null) return;

            _accessToken = auth.AccessToken;
            _tokenExpiration = _clock.UtcNow.AddSeconds(auth.ExpiresIn - 60);
        }
        finally
        {
            _tokenSemaphore.Release();
        }
    }

    private static string ProcessCoverUrl(string thumbUrl)
    {
        if (thumbUrl.StartsWith("//"))
            thumbUrl = "https:" + thumbUrl;
        return thumbUrl.Replace("t_thumb", "t_cover_big");
    }
}
