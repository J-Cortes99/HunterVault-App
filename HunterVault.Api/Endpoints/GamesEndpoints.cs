using System.Security.Claims;
using HunterVault.Api.Data;
using HunterVault.Api.Dtos;
using HunterVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Api.Endpoints;

public static class GamesEndpoints
{
    const string GetGameEndpointName = "GetGame";

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var value = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }

    public static void MapGamesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/games").RequireAuthorization();

        // GET /games
        group.MapGet("/", async (ClaimsPrincipal user, HunterVaultContext dbContext) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            return Results.Ok(await dbContext.Games
                .Where(game => game.UserId == userId.Value)
                .Include(game => game.Genre)
                .Select(game => new GameSummaryDto(
                    Id: game.Id,
                    Name: game.Name,
                    Genre: game.Genre!.Name,
                    Price: game.Price,
                    ReleaseDate: game.ReleaseDate,
                    Platform: game.Platform
                ))
                .AsNoTracking()
                .ToListAsync());
        });

        // GET /games/1
        group.MapGet("/{id}", async (int id, ClaimsPrincipal user, HunterVaultContext dbContext) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var game = await dbContext.Games.FirstOrDefaultAsync(
                g => g.Id == id && g.UserId == userId.Value);

            return game is null ? Results.NotFound() : Results.Ok(
                new GameDetailsDto(
                    Id: game.Id,
                    Name: game.Name,
                    GenreId: game.GenreId,
                    Price: game.Price,
                    ReleaseDate: game.ReleaseDate,
                    Platform: game.Platform
                )
            );
        })
            .WithName(GetGameEndpointName);

        // POST /games
        group.MapPost("/", async (CreateGameDto newGame, ClaimsPrincipal user, HunterVaultContext dbContext) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            Game game = new Game
            {
                Name = newGame.Name,
                GenreId = newGame.GenreId,
                Price = newGame.Price,
                ReleaseDate = newGame.ReleaseDate,
                Platform = newGame.Platform,
                UserId = userId.Value
            };

            dbContext.Games.Add(game);
            await dbContext.SaveChangesAsync();

            GameDetailsDto gameDto = new GameDetailsDto(
                Id: game.Id,
                Name: game.Name,
                GenreId: game.GenreId,
                Price: game.Price,
                ReleaseDate: game.ReleaseDate,
                Platform: game.Platform
            );

            return Results.CreatedAtRoute(GetGameEndpointName, new { id = gameDto.Id }, gameDto);
        });

        // PUT /games/1
        group.MapPut("/{id}", async (int id, UpdateGameDto updatedGame, ClaimsPrincipal user, HunterVaultContext dbContext) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var existingGame = await dbContext.Games.FirstOrDefaultAsync(
                g => g.Id == id && g.UserId == userId.Value);
            if (existingGame is null)
            {
                return Results.NotFound();
            }

            existingGame.Name = updatedGame.Name;
            existingGame.GenreId = updatedGame.GenreId;
            existingGame.Price = updatedGame.Price;
            existingGame.ReleaseDate = updatedGame.ReleaseDate;
            existingGame.Platform = updatedGame.Platform;

            await dbContext.SaveChangesAsync();

            return Results.NoContent();
        });

        // DELETE /games/1
        group.MapDelete("/{id}", async (int id, ClaimsPrincipal user, HunterVaultContext dbContext) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            await dbContext.Games
                .Where(game => game.Id == id && game.UserId == userId.Value)
                .ExecuteDeleteAsync();

            return Results.NoContent();
        });
    }
}
