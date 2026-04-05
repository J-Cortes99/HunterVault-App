using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using HunterVault.Api.Dtos;

namespace HunterVault.Api.Services;

public class IgdbService : IIgdbService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<IgdbService> _logger;
    private readonly IMemoryCache _cache;
    
    private readonly SemaphoreSlim _tokenSemaphore = new(1, 1); // 2. Añadido Semáforo
    
    private readonly string _clientId;
    private readonly string _clientSecret;
    
    private string? _accessToken;
    private DateTime _tokenExpiration;

    public IgdbService(HttpClient httpClient, IConfiguration configuration, ILogger<IgdbService> logger, IMemoryCache cache)
    {
        _httpClient = httpClient;
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "HunterVault-Api");
        _configuration = configuration;
        _logger = logger;
        _cache = cache;

        // 3. Leemos la config una sola vez
        _clientId = _configuration["IgdbApi:ClientId"] ?? string.Empty;
        _clientSecret = _configuration["IgdbApi:ClientSecret"] ?? string.Empty;
    }

    private async Task EnsureAccessTokenAsync()
    {
        // Doble comprobación (patrón Double-Check Locking)
        if (!string.IsNullOrEmpty(_accessToken) && DateTime.UtcNow < _tokenExpiration)
            return;

        await _tokenSemaphore.WaitAsync();
        try
        {
            // Comprobamos de nuevo por si otro hilo ya lo renovó mientras este esperaba
            if (!string.IsNullOrEmpty(_accessToken) && DateTime.UtcNow < _tokenExpiration)
                return;

            if (string.IsNullOrEmpty(_clientId) || string.IsNullOrEmpty(_clientSecret))
            {
                _logger.LogError("IGDB Credentials are missing in configuration.");
                return;
            }

            var url = $"https://id.twitch.tv/oauth2/token?client_id={_clientId}&client_secret={_clientSecret}&grant_type=client_credentials";
            var response = await _httpClient.PostAsync(url, null);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var authResponse = JsonSerializer.Deserialize<TwitchAuthResponse>(content);
                if (authResponse != null)
                {
                    _accessToken = authResponse.AccessToken;
                    _tokenExpiration = DateTime.UtcNow.AddSeconds(authResponse.ExpiresIn - 60);
                }
            }
            else
            {
                _logger.LogWarning("Failed to retrieve IGDB access token. Status: {StatusCode}", response.StatusCode);
            }
        }
        finally
        {
            _tokenSemaphore.Release();
        }
    }


    public async Task<List<IgdbGameResponse>> SearchGamesAsync(string query)
    {
        string cacheKey = $"igdb_search_{query.ToLower().Trim()}";
        if (_cache.TryGetValue(cacheKey, out List<IgdbGameResponse>? cachedResults))
        {
            _logger.LogInformation("Serving search results from cache for: {Query}", query);
            return cachedResults ?? new List<IgdbGameResponse>();
        }

        var results = new List<IgdbGameResponse>();
        try 
        {
            await EnsureAccessTokenAsync();

            if (string.IsNullOrEmpty(_accessToken) || string.IsNullOrWhiteSpace(query))
                return results;

            var safeGameName = query.Replace("\"", "\\\"");

            using (var searchRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.igdb.com/v4/games"))
            {
                searchRequest.Headers.Add("Client-ID", _clientId);
                searchRequest.Headers.Add("Authorization", $"Bearer {_accessToken}");
                searchRequest.Content = new StringContent($"search \"{safeGameName}\"; fields id, name, cover.url, category; limit 15;", Encoding.UTF8, "text/plain");

                var searchResponse = await _httpClient.SendAsync(searchRequest);
                if (searchResponse.IsSuccessStatusCode)
                {
                    var content = await searchResponse.Content.ReadAsStringAsync();
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var igdbGames = JsonSerializer.Deserialize<List<IgdbGameResponse>>(content, options);

                    if (igdbGames != null && igdbGames.Count > 0)
                    {
                        var mainGameCategories = new[] { 0, 8, 9, 10, 11 };
                        
                        foreach(var g in igdbGames)
                        {
                            if(g.Cover != null && !string.IsNullOrEmpty(g.Cover.Url))
                            {
                                g.Cover.Url = ProcessCoverUrl(g.Cover.Url);
                            }
                        }
                        
                        results = igdbGames
                            .Where(g => mainGameCategories.Contains(g.Category))
                            .GroupBy(g => g.Name)
                            .Select(grp => grp.First())
                            .Take(8)
                            .ToList();

                        _cache.Set(cacheKey, results, TimeSpan.FromMinutes(15));
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching IGDB for game: {Query}", query);
        }

        return results;
    }

    private string ProcessCoverUrl(string thumbUrl)
    {
        if (thumbUrl.StartsWith("//"))
            thumbUrl = "https:" + thumbUrl;
        
        return thumbUrl.Replace("t_thumb", "t_cover_big");
    }



    private async Task PopulateTimeToBeatAsync(HunterVault.Api.Dtos.IgdbGameDetailsDto dto)
    {
        try
        {
            using (var ttbRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.igdb.com/v4/game_time_to_beats"))
            {
                ttbRequest.Headers.Add("Client-ID", _clientId);
                ttbRequest.Headers.Add("Authorization", $"Bearer {_accessToken}");
                ttbRequest.Content = new StringContent($"where game_id = {dto.Id}; fields *;", Encoding.UTF8, "text/plain");

                var ttbResponse = await _httpClient.SendAsync(ttbRequest);
                if (ttbResponse.IsSuccessStatusCode)
                {
                    var content = await ttbResponse.Content.ReadAsStringAsync();
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var ttbResults = JsonSerializer.Deserialize<List<IgdbTimeToBeatResponse>>(content, options);
                    var ttb = ttbResults?.FirstOrDefault();

                    if (ttb != null)
                    {
                        dto.Normally = ttb.Normally;
                        dto.Hastily = ttb.Hastily;
                        dto.Completely = ttb.Completely;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not fetch Time to Beat for game ID {GameId}", dto.Id);
        }
    }

    public async Task<HunterVault.Api.Dtos.IgdbGameDetailsDto?> GetFullGameDetailsByIdAsync(int igdbId)
    {
        string cacheKey = $"igdb_details_{igdbId}";
        if (_cache.TryGetValue(cacheKey, out HunterVault.Api.Dtos.IgdbGameDetailsDto? cachedDetails))
        {
            _logger.LogInformation("Misión cumplida: datos de juego {IgdbId} servidos desde el cache (RAM)", igdbId);
            return cachedDetails;
        }

        try
        {
            await EnsureAccessTokenAsync();
            if (string.IsNullOrEmpty(_accessToken)) return null;

            _logger.LogInformation("Llamando a la API de IGDB por primera vez para el juego {IgdbId}", igdbId);

            using (var request = new HttpRequestMessage(HttpMethod.Post, "https://api.igdb.com/v4/games"))
            {
                request.Headers.Add("Client-ID", _clientId);
                request.Headers.Add("Authorization", $"Bearer {_accessToken}");
                request.Content = new StringContent($"where id = {igdbId}; fields id, name, summary, cover.url, genres.name, platforms.name, first_release_date, rating, screenshots.url, videos.video_id, category; limit 1;", Encoding.UTF8, "text/plain");

                var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var games = JsonSerializer.Deserialize<List<IgdbGameResponse>>(content, options);
                    var game = games?.FirstOrDefault();

                    if (game != null)
                    {
                        var dto = new HunterVault.Api.Dtos.IgdbGameDetailsDto
                        {
                            Id = game.Id,
                            Name = game.Name,
                            Summary = game.Summary,
                            CoverUrl = game.Cover != null ? ProcessCoverUrl(game.Cover.Url).Replace("t_cover_big", "t_1080p") : null,
                            Rating = game.Rating,
                            FirstReleaseDate = game.FirstReleaseDate,
                            Genres = game.Genres?.Select(g => g.Name).ToList() ?? new(),
                            Platforms = game.Platforms?.Select(p => p.Name).ToList() ?? new(),
                            Screenshots = game.Screenshots?.Select(s => ProcessCoverUrl(s.Url).Replace("t_cover_big", "t_1080p")).ToList() ?? new(),
                            TrailerYoutubeId = game.Videos?.FirstOrDefault()?.VideoId
                        };
                        await PopulateTimeToBeatAsync(dto);

                        _cache.Set(cacheKey, dto, TimeSpan.FromHours(24));
                        return dto;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving full details by ID {IgdbId}", igdbId);
        }
        return null;
    }
}

public class TwitchAuthResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }
}

public class IgdbGameResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public int Category { get; set; }

    [JsonPropertyName("cover")]
    public IgdbCoverResponse? Cover { get; set; }

    [JsonPropertyName("genres")]
    public List<IgdbGenreResponse>? Genres { get; set; }

    [JsonPropertyName("summary")]
    public string Summary { get; set; } = string.Empty;

    [JsonPropertyName("rating")]
    public double? Rating { get; set; }

    [JsonPropertyName("first_release_date")]
    public long? FirstReleaseDate { get; set; }

    [JsonPropertyName("platforms")]
    public List<IgdbPlatformResponse>? Platforms { get; set; }

    [JsonPropertyName("screenshots")]
    public List<IgdbScreenshotResponse>? Screenshots { get; set; }

    [JsonPropertyName("videos")]
    public List<IgdbVideoResponse>? Videos { get; set; }
}

public class IgdbGenreResponse
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class IgdbCoverResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;
}

public class IgdbPlatformResponse
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class IgdbScreenshotResponse
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;
}

public class IgdbVideoResponse
{
    [JsonPropertyName("video_id")]
    public string VideoId { get; set; } = string.Empty;
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class IgdbTimeToBeatResponse
{
    [JsonPropertyName("game_id")]
    public int GameId { get; set; }
    
    [JsonPropertyName("hastily")]
    public int? Hastily { get; set; }
    
    [JsonPropertyName("normally")]
    public int? Normally { get; set; }
    
    [JsonPropertyName("completely")]
    public int? Completely { get; set; }
}
