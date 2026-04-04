using HunterVault.Api.Models;

namespace HunterVault.Api.Dtos;

public record GameDetailsDto(
    int Id,
    string Name,
    int GenreId,
    DateOnly? CompletionDate,
    string Platform,
    GameStatus Status,
    GameFormat Format,
    int? HoursPlayed,
    int? DifficultyRating,
    string? Review
);
