using HunterVault.Api.Data;
using HunterVault.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Api.Endpoints;

public static class ProfileEndpoints
{
    public static void MapProfileEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/profile");

        // GET /profile/{username} — public, no auth required
        group.MapGet("/{username}", async (string username, HunterVaultContext dbContext) =>
        {
            var user = await dbContext.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user is null)
                return Results.NotFound(new { message = "User not found." });

            var games = await dbContext.Games
                .Where(g => g.UserId == user.Id)
                .Include(g => g.Genre)
                .Select(g => new GameSummaryDto(
                    Id: g.Id,
                    Name: g.Name,
                    Genre: g.Genre!.Name,
                    Price: g.Price,
                    ReleaseDate: g.ReleaseDate,
                    Platform: g.Platform
                ))
                .AsNoTracking()
                .ToListAsync();

            return Results.Ok(new
            {
                username = user.Username,
                totalGames = games.Count,
                games
            });
        });
    }
}
