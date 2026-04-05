using System.Security.Claims;
using HunterVault.Api.Data;
using HunterVault.Api.Dtos;
using HunterVault.Api.Models;
using HunterVault.Api.Services;
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
        var group = app.MapGroup("/api/games").RequireAuthorization();

        // GET /games
        group.MapGet("/", async (ClaimsPrincipal user, HunterVaultContext dbContext) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            return Results.Ok(await dbContext.Games
                .Where(game => game.UserId == userId.Value)
                .Select(game => new GameSummaryDto(
                    Id: game.Id,
                    Name: game.Name,
                    Genres: game.Genres,
                    Platform: game.Platform,
                    Status: game.Status,
                    HoursPlayed: game.HoursPlayed,
                    DifficultyRating: game.DifficultyRating,
                    TrophyPercentage: game.TrophyPercentage,
                    CoverUrl: game.CoverUrl,
                    Review: game.Review,
                    IgdbId: game.IgdbId
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
                    Genres: game.Genres,
                    Platform: game.Platform,
                    Status: game.Status,
                    HoursPlayed: game.HoursPlayed,
                    DifficultyRating: game.DifficultyRating,
                    TrophyPercentage: game.TrophyPercentage,
                    CoverUrl: game.CoverUrl,
                    Review: game.Review,
                    IgdbId: game.IgdbId
                )
            );
        })
            .WithName(GetGameEndpointName);

        // POST /games
        group.MapPost("/", async (CreateGameDto newGame, ClaimsPrincipal user, HunterVaultContext dbContext, IIgdbService igdbService) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            Game game = new Game
            {
                Name = newGame.Name,
                Platform = newGame.Platform,
                Status = newGame.Status,
                HoursPlayed = newGame.HoursPlayed,
                DifficultyRating = newGame.DifficultyRating,
                TrophyPercentage = newGame.Status == GameStatus.Platinumed ? 100 : (newGame.Status is GameStatus.Backlog or GameStatus.Dropped ? null : newGame.TrophyPercentage),
                Review = newGame.Review,
                UserId = userId.Value,
                IgdbId = newGame.IgdbId
            };

            IgdbGameDetailsDto? details = null;
            if (game.IgdbId.HasValue)
            {
                details = await igdbService.GetFullGameDetailsByIdAsync(game.IgdbId.Value);
            }

            if (details != null)
            {
                game.CoverUrl = details.CoverUrl;
                game.Genres = details.Genres;
                if (game.IgdbId == null || game.IgdbId == 0)
                {
                    game.IgdbId = details.Id;
                }
            }

            dbContext.Games.Add(game);
            await dbContext.SaveChangesAsync();

            GameDetailsDto gameDto = new GameDetailsDto(
                Id: game.Id,
                Name: game.Name,
                Genres: game.Genres,
                Platform: game.Platform,
                Status: game.Status,
                HoursPlayed: game.HoursPlayed,
                DifficultyRating: game.DifficultyRating,
                TrophyPercentage: game.TrophyPercentage,
                CoverUrl: game.CoverUrl,
                Review: game.Review,
                IgdbId: game.IgdbId
            );

            return Results.CreatedAtRoute(GetGameEndpointName, new { id = gameDto.Id }, gameDto);
        });

        // PUT /games/1
        group.MapPut("/{id}", async (int id, UpdateGameDto updatedGame, ClaimsPrincipal user, HunterVaultContext dbContext, IIgdbService igdbService) =>
        {
            var userId = GetUserId(user);
            if (userId is null) return Results.Unauthorized();

            var existingGame = await dbContext.Games.FirstOrDefaultAsync(
                g => g.Id == id && g.UserId == userId.Value);
            if (existingGame is null)
            {
                return Results.NotFound();
            }

            if (existingGame.Name != updatedGame.Name || existingGame.IgdbId != updatedGame.IgdbId || string.IsNullOrEmpty(existingGame.CoverUrl))
            {
                existingGame.Name = updatedGame.Name;
                existingGame.IgdbId = updatedGame.IgdbId;

                IgdbGameDetailsDto? details = null;
                if (existingGame.IgdbId.HasValue)
                {
                    details = await igdbService.GetFullGameDetailsByIdAsync(existingGame.IgdbId.Value);
                }

                if (details != null)
                {
                    existingGame.CoverUrl = details.CoverUrl;
                    existingGame.Genres = details.Genres;
                    if (existingGame.IgdbId == null || existingGame.IgdbId == 0)
                    {
                        existingGame.IgdbId = details.Id;
                    }
                }
            }
            
            existingGame.Platform = updatedGame.Platform;
            existingGame.Status = updatedGame.Status;
            existingGame.HoursPlayed = updatedGame.HoursPlayed;
            existingGame.DifficultyRating = updatedGame.DifficultyRating;
            existingGame.TrophyPercentage = updatedGame.Status == GameStatus.Platinumed ? 100 : (updatedGame.Status is GameStatus.Backlog or GameStatus.Dropped ? null : updatedGame.TrophyPercentage);
            existingGame.Review = updatedGame.Review;

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
