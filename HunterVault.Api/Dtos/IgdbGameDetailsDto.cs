namespace HunterVault.Api.Dtos;

public class IgdbGameDetailsDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
    public double? Rating { get; set; }
    public long? FirstReleaseDate { get; set; } 
    public List<string> Genres { get; set; } = new();
    public List<string> Platforms { get; set; } = new();
    public List<string> Screenshots { get; set; } = new();
    public int? Normally { get; set; }
    public int? Hastily { get; set; }
    public int? Completely { get; set; }
    public string? TrailerYoutubeId { get; set; }
}
