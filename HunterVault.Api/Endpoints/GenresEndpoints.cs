using HunterVault.Api.Data;
using HunterVault.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Api.Endpoints;

public static class GenresEndpoints
{
    public static void MapGenresEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/genres");

        // GET /genres
        group.MapGet("/", async (HunterVaultContext dbContext) =>
        {
            var genres = await dbContext.Genres
                .Select(genre => new GenreDto(
                    Id: genre.Id,
                    Name: genre.Name
                ))
                .AsNoTracking()
                .ToListAsync();

            return Results.Ok(genres);
        });
    }
}
