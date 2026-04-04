using HunterVault.Api.Models;

namespace HunterVault.Api.Dtos;

public record GameSummaryDto(
    int Id,
    string Name,
    string Genre,
    DateOnly? CompletionDate,
    string Platform,
    GameStatus Status,
    GameFormat Format,
    int? HoursPlayed,
    int? DifficultyRating,
    string? Review
);
