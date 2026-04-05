using System.ComponentModel.DataAnnotations;
using HunterVault.Api.Models;

namespace HunterVault.Api.Dtos;

public record CreateGameDto(
    [Required][StringLength(50)] string Name,
    [Required][StringLength(30)] string Platform,
    GameStatus Status,
    [Range(0, 9999)] int? HoursPlayed,
    [Range(1, 10)] int? DifficultyRating,
    [Range(0, 100)] int? TrophyPercentage,
    [StringLength(2000)] string? Review,
    int? IgdbId
);
