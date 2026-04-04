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

    public async Task<string?> GetGameCoverUrlAsync(string gameName)
    {
        try 
        {
            await EnsureAccessTokenAsync();

            if (string.IsNullOrEmpty(_accessToken))
                return null;

            var mainGameCategories = new[] { 0, 8, 9, 10, 11 };
            var safeGameName = gameName.Replace("\"", "\\\"");

            // 1. FIRST ATTEMPT: EXACT SEARCH
            using (var exactRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.igdb.com/v4/games"))
            {
                exactRequest.Headers.Add("Client-ID", _clientId);
                exactRequest.Headers.Add("Authorization", $"Bearer {_accessToken}");
                exactRequest.Content = new StringContent($"where name = \"{safeGameName}\" & cover != null; fields name, cover.url, category; limit 1;", Encoding.UTF8, "text/plain");

                var exactResponse = await _httpClient.SendAsync(exactRequest);
                if (exactResponse.IsSuccessStatusCode)
                {
                    var content = await exactResponse.Content.ReadAsStringAsync();
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var exactGames = JsonSerializer.Deserialize<List<IgdbGameResponse>>(content, options);

                    var bestExact = exactGames?.FirstOrDefault(g => mainGameCategories.Contains(g.Category));
                    if (bestExact?.Cover != null)
                    {
                        return ProcessCoverUrl(bestExact.Cover.Url);
                    }
                }
            }

            // 2. SECOND ATTEMPT: FUZZY SEARCH
            using (var searchRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.igdb.com/v4/games"))
            {
                searchRequest.Headers.Add("Client-ID", _clientId);
                searchRequest.Headers.Add("Authorization", $"Bearer {_accessToken}");
                searchRequest.Content = new StringContent($"search \"{safeGameName}\"; fields name, cover.url, category; limit 10;", Encoding.UTF8, "text/plain");

                var searchResponse = await _httpClient.SendAsync(searchRequest);
                if (searchResponse.IsSuccessStatusCode)
                {
                    var content = await searchResponse.Content.ReadAsStringAsync();
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var igdbGames = JsonSerializer.Deserialize<List<IgdbGameResponse>>(content, options);

                    if (igdbGames == null || igdbGames.Count == 0) return null;

                    var bestMatch = igdbGames
                        .Select(g => new 
                        { 
                            Game = g, 
                            Score = CalculateScore(g, gameName, mainGameCategories) 
                        })
                        .OrderByDescending(x => x.Score)
                        .ThenBy(x => x.Game.Id) 
                        .First();

                    if (bestMatch.Game.Cover != null)
                    {
                        return ProcessCoverUrl(bestMatch.Game.Cover.Url);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            // 4. Registramos el error sin romper la aplicación
            _logger.LogError(ex, "Error retrieving cover URL from IGDB for game: {GameName}", gameName);
        }

        return null;
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
}

public class IgdbCoverResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;
}
