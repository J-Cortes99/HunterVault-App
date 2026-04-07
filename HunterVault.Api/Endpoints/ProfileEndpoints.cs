using System.Security.Claims;
using HunterVault.Api.Data;
using HunterVault.Api.Dtos;
using HunterVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Api.Endpoints;

public static class ProfileEndpoints
{
    public static void MapProfileEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/profile").RequireRateLimiting("fixed");

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
                .AsNoTracking()
                .ToListAsync();

            // 1. Calculate Total XP based on user's formula
            double totalXp = 0;
            foreach (var game in games)
            {
                // Experience per Trophy Percentage (10 XP per 1%)
                double gameXp = (game.TrophyPercentage ?? 0) * 10;

                // Status Bonuses
                if (game.Status == GameStatus.Completed) gameXp += 500;
                if (game.Status == GameStatus.Platinumed) gameXp += 2000;

                // Difficulty Multiplier: 1.0 + (DifficultyRating * 0.1)
                double difficultyMultiplier = 1.0 + ((game.DifficultyRating ?? 0) * 0.1);
                
                totalXp += (gameXp * difficultyMultiplier);
            }

            // 2. Calculate Level: Square root of (Total XP / 100)
            int currentLevel = (int)Math.Max(1, Math.Sqrt(totalXp / 100));

            // 3. XP needed for the next level: (Level + 1)^2 * 100
            double xpForNextLevel = Math.Pow(currentLevel + 1, 2) * 100;

            var gameDtos = games.Select(g => new GameSummaryDto(
                Id: g.Id,
                Name: g.Name,
                Genres: g.Genres,
                Platform: g.Platform,
                Status: g.Status,
                HoursPlayed: g.HoursPlayed,
                DifficultyRating: g.DifficultyRating,
                TrophyPercentage: g.TrophyPercentage,
                CoverUrl: g.CoverUrl,
                Review: g.Review,
                IgdbId: g.IgdbId
            )).ToList();

            return Results.Ok(new
            {
                username = user.Username,
                bio = user.Bio,
                avatarUrl = user.AvatarUrl,
                bannerUrl = user.BannerUrl,
                level = currentLevel,
                totalXp = (int)totalXp,
                nextLevelXp = (int)xpForNextLevel,
                totalGames = games.Count,
                games = gameDtos
            });
        });

        // PUT /profile — authenticated, updates the profile of the current user
        group.MapPut("/", async (UpdateProfileDto dto, ClaimsPrincipal principal, HunterVaultContext dbContext) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out Guid userId))
                return Results.Unauthorized();

            var user = await dbContext.Users.FindAsync(userId);
            if (user is null)
                return Results.NotFound(new { message = "User not found." });

            user.Bio = dto.Bio;
            user.AvatarUrl = dto.AvatarUrl;
            user.BannerUrl = dto.BannerUrl;

            await dbContext.SaveChangesAsync();

            return Results.Ok(new { message = "Profile updated successfully." });
        }).RequireAuthorization();
    }
}
