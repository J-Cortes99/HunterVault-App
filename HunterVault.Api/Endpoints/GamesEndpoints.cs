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
                    CompletionDate: game.CompletionDate,
                    Platform: game.Platform,
                    Status: game.Status,
                    Format: game.Format,
                    HoursPlayed: game.HoursPlayed,
                    DifficultyRating: game.DifficultyRating,
                    TrophyPercentage: game.TrophyPercentage,
                    CoverUrl: game.CoverUrl,
                    Review: game.Review
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
                    CompletionDate: game.CompletionDate,
                    Platform: game.Platform,
                    Status: game.Status,
                    Format: game.Format,
                    HoursPlayed: game.HoursPlayed,
                    DifficultyRating: game.DifficultyRating,
                    TrophyPercentage: game.TrophyPercentage,
                    CoverUrl: game.CoverUrl,
                    Review: game.Review
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
                GenreId = newGame.GenreId,
                CompletionDate = newGame.CompletionDate,
                Platform = newGame.Platform,
                Status = newGame.Status,
                Format = newGame.Format,
                HoursPlayed = newGame.HoursPlayed,
                DifficultyRating = newGame.DifficultyRating,
                TrophyPercentage = newGame.Status == GameStatus.Platinumed ? 100 : (newGame.Status is GameStatus.Backlog or GameStatus.Dropped ? null : newGame.TrophyPercentage),
                Review = newGame.Review,
                UserId = userId.Value
            };

            game.CoverUrl = await igdbService.GetGameCoverUrlAsync(game.Name);

            dbContext.Games.Add(game);
            await dbContext.SaveChangesAsync();

            GameDetailsDto gameDto = new GameDetailsDto(
                Id: game.Id,
                Name: game.Name,
                GenreId: game.GenreId,
                CompletionDate: game.CompletionDate,
                Platform: game.Platform,
                Status: game.Status,
                Format: game.Format,
                HoursPlayed: game.HoursPlayed,
                DifficultyRating: game.DifficultyRating,
                TrophyPercentage: game.TrophyPercentage,
                CoverUrl: game.CoverUrl,
                Review: game.Review
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

            if (existingGame.Name != updatedGame.Name || string.IsNullOrEmpty(existingGame.CoverUrl))
            {
                existingGame.Name = updatedGame.Name;
                existingGame.CoverUrl = await igdbService.GetGameCoverUrlAsync(existingGame.Name);
            }
            
            existingGame.GenreId = updatedGame.GenreId;
            existingGame.CompletionDate = updatedGame.CompletionDate;
            existingGame.Platform = updatedGame.Platform;
            existingGame.Status = updatedGame.Status;
            existingGame.Format = updatedGame.Format;
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
