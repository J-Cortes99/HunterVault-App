using System.Text.Json.Serialization;

namespace HunterVault.Infrastructure.External;

internal class TwitchAuthResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }
}

internal class IgdbGameResponse
{
    [JsonPropertyName("id")] public int Id { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("category")] public int Category { get; set; }
    [JsonPropertyName("cover")] public IgdbCoverResponse? Cover { get; set; }
    [JsonPropertyName("genres")] public List<IgdbGenreResponse>? Genres { get; set; }
    [JsonPropertyName("summary")] public string Summary { get; set; } = string.Empty;
    [JsonPropertyName("rating")] public double? Rating { get; set; }
    [JsonPropertyName("first_release_date")] public long? FirstReleaseDate { get; set; }
    [JsonPropertyName("platforms")] public List<IgdbPlatformResponse>? Platforms { get; set; }
    [JsonPropertyName("screenshots")] public List<IgdbScreenshotResponse>? Screenshots { get; set; }
    [JsonPropertyName("videos")] public List<IgdbVideoResponse>? Videos { get; set; }
}

internal class IgdbGenreResponse
{
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
}

internal class IgdbCoverResponse
{
    [JsonPropertyName("id")] public int Id { get; set; }
    [JsonPropertyName("url")] public string Url { get; set; } = string.Empty;
}

internal class IgdbPlatformResponse
{
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
}

internal class IgdbScreenshotResponse
{
    [JsonPropertyName("url")] public string Url { get; set; } = string.Empty;
}

internal class IgdbVideoResponse
{
    [JsonPropertyName("video_id")] public string VideoId { get; set; } = string.Empty;
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
}

internal class IgdbTimeToBeatResponse
{
    [JsonPropertyName("game_id")] public int GameId { get; set; }
    [JsonPropertyName("hastily")] public int? Hastily { get; set; }
    [JsonPropertyName("normally")] public int? Normally { get; set; }
    [JsonPropertyName("completely")] public int? Completely { get; set; }
}
