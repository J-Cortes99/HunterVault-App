using System.ComponentModel.DataAnnotations;
using HunterVault.Api.Models;

namespace HunterVault.Api.Dtos;

public record CreateGameDto(
    [Required][StringLength(50)] string Name,
    [Range(1, 60)] int GenreId,
    DateOnly? CompletionDate,
    [Required][StringLength(30)] string Platform,
    GameStatus Status,
    GameFormat Format,
    [Range(0, 9999)] int? HoursPlayed,
    [Range(1, 10)] int? DifficultyRating,
    [StringLength(2000)] string? Review
);
