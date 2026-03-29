using GameStore.Api.Data;
using GameStore.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace GameStore.Api.Endpoints;

public static class GenresEndpoints
{
    public static void MapGenresEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/genres");

        // GET /genres
        group.MapGet("/", async (GameStoreContext dbContext) =>
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
