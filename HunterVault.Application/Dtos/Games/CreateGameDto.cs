using System.ComponentModel.DataAnnotations;
using HunterVault.Domain.Enums;

namespace HunterVault.Application.Dtos.Games;

public record CreateGameDto(
    [Required][StringLength(200)] string Name,
    [Required][StringLength(30)] string Platform,
    GameStatus Status,
    [Range(0, 9999)] int? HoursPlayed,
    [Range(1, 10)] int? DifficultyRating,
    [Range(0, 100)] int? TrophyPercentage,
    [StringLength(2000)] string? Review,
    int? IgdbId
);
