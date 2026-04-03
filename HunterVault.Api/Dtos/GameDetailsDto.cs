namespace HunterVault.Api.Dtos;

public record GameDetailsDto(
    int Id,
    string Name,
    int GenreId,
    decimal Price,
    DateOnly ReleaseDate,
    string Platform
);
