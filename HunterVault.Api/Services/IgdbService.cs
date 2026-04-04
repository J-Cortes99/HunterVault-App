using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace HunterVault.Api.Services;

public class IgdbService : IIgdbService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<IgdbService> _logger; // 1. Añadido Logger
    
    private readonly SemaphoreSlim _tokenSemaphore = new(1, 1); // 2. Añadido Semáforo
    
    private readonly string _clientId;
    private readonly string _clientSecret;
    
    private string? _accessToken;
    private DateTime _tokenExpiration;

    public IgdbService(HttpClient httpClient, IConfiguration configuration, ILogger<IgdbService> logger)
    {
        _httpClient = httpClient;
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "HunterVault-Api");
        _configuration = configuration;
        _logger = logger;

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

    public async Task<(string? CoverUrl, List<string> Genres)> GetGameDetailsAsync(string gameName)
    {
        try 
        {
            await EnsureAccessTokenAsync();

            if (string.IsNullOrEmpty(_accessToken))
                return (null, []);

            var mainGameCategories = new[] { 0, 8, 9, 10, 11 };
            var safeGameName = gameName.Replace("\"", "\\\"");

            // 1. FIRST ATTEMPT: EXACT SEARCH
            using (var exactRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.igdb.com/v4/games"))
            {
                exactRequest.Headers.Add("Client-ID", _clientId);
                exactRequest.Headers.Add("Authorization", $"Bearer {_accessToken}");
                exactRequest.Content = new StringContent($"where name = \"{safeGameName}\" & cover != null; fields name, cover.url, category, genres.name; limit 1;", Encoding.UTF8, "text/plain");

                var exactResponse = await _httpClient.SendAsync(exactRequest);
                if (exactResponse.IsSuccessStatusCode)
                {
                    var content = await exactResponse.Content.ReadAsStringAsync();
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var exactGames = JsonSerializer.Deserialize<List<IgdbGameResponse>>(content, options);

                    var bestExact = exactGames?.FirstOrDefault(g => mainGameCategories.Contains(g.Category));
                    if (bestExact != null)
                    {
                        var cover = bestExact.Cover != null ? ProcessCoverUrl(bestExact.Cover.Url) : null;
                        var genres = bestExact.Genres?.Select(g => g.Name).ToList() ?? [];
                        return (cover, genres);
                    }
                }
            }

            // 2. SECOND ATTEMPT: FUZZY SEARCH
            using (var searchRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.igdb.com/v4/games"))
            {
                searchRequest.Headers.Add("Client-ID", _clientId);
                searchRequest.Headers.Add("Authorization", $"Bearer {_accessToken}");
                searchRequest.Content = new StringContent($"search \"{safeGameName}\"; fields name, cover.url, category, genres.name; limit 10;", Encoding.UTF8, "text/plain");

                var searchResponse = await _httpClient.SendAsync(searchRequest);
                if (searchResponse.IsSuccessStatusCode)
                {
                    var content = await searchResponse.Content.ReadAsStringAsync();
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var igdbGames = JsonSerializer.Deserialize<List<IgdbGameResponse>>(content, options);

                    if (igdbGames == null || igdbGames.Count == 0) return (null, []);

                    var bestMatch = igdbGames
                        .Select(g => new 
                        { 
                            Game = g, 
                            Score = CalculateScore(g, gameName, mainGameCategories) 
                        })
                        .OrderByDescending(x => x.Score)
                        .ThenBy(x => x.Game.Id) 
                        .First();

                    var cover = bestMatch.Game.Cover != null ? ProcessCoverUrl(bestMatch.Game.Cover.Url) : null;
                    var genres = bestMatch.Game.Genres?.Select(g => g.Name).ToList() ?? [];
                    return (cover, genres);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving details from IGDB for game: {GameName}", gameName);
        }

        return (null, []);
    }

    public async Task<List<IgdbGameResponse>> SearchGamesAsync(string query)
    {
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
                searchRequest.Content = new StringContent($"search \"{safeGameName}\"; fields name, cover.url, category; limit 15;", Encoding.UTF8, "text/plain");

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

    private static int CalculateScore(IgdbGameResponse game, string searchName, int[] mainGameCategories)
    {
        if (game.Cover == null) return -1000;

        int score = 0;

        if (mainGameCategories.Contains(game.Category)) score += 100;

        var cleanSearch = searchName.Replace(":", "").Replace("-", "").Replace(" ", "").ToLower();
        var cleanResult = game.Name.Replace(":", "").Replace("-", "").Replace(" ", "").ToLower();

        if (cleanResult == cleanSearch) score += 50;
        else if (cleanResult.Contains(cleanSearch)) score += 20;

        score -= game.Name.Length;

        return score;
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
