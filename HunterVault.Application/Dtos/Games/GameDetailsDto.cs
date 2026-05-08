using HunterVault.Domain.Enums;

namespace HunterVault.Application.Dtos.Games;

public record GameDetailsDto(
    int Id,
    string Name,
    List<string> Genres,
    string Platform,
    GameStatus Status,
    int? HoursPlayed,
    int? DifficultyRating,
    int? TrophyPercentage,
    string? CoverUrl,
    string? Review,
    int? IgdbId
);
