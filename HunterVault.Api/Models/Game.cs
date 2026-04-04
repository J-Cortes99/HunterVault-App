namespace HunterVault.Api.Models;
using HunterVault.Api.Entities;

public class Game
{
    public int Id { get; set; }
    public User? User { get; set; }
    public Guid UserId { get; set; }
    public required string Name { get; set; }
    public Genre? Genre { get; set; }
    public int GenreId { get; set; }
    public DateOnly? CompletionDate { get; set; }
    public string Platform { get; set; } = string.Empty;
    public GameStatus Status { get; set; } = GameStatus.Backlog;
    public GameFormat Format { get; set; } = GameFormat.Digital;
    public int? HoursPlayed { get; set; }
    public int? DifficultyRating { get; set; }
    public int? TrophyPercentage { get; set; }
    public string? CoverUrl { get; set; }
    public string? Review { get; set; }
}
