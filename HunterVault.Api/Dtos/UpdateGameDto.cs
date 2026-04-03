using System.ComponentModel.DataAnnotations;

namespace HunterVault.Api.Dtos;

public record UpdateGameDto(
    [Required][StringLength(50)] string Name,
    [Range(1, 50)] int GenreId,
    [Range(0, 1000)]decimal Price,
    DateOnly ReleaseDate,
    [Required][StringLength(30)] string Platform
);
