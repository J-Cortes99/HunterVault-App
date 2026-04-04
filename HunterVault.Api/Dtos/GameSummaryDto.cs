using HunterVault.Api.Models;

namespace HunterVault.Api.Dtos;

public record GameSummaryDto(
    int Id,
    string Name,
    List<string> Genres,
    string Platform,
    GameStatus Status,
    int? HoursPlayed,
    int? DifficultyRating,
    int? TrophyPercentage,
    string? CoverUrl,
    string? Review
);
