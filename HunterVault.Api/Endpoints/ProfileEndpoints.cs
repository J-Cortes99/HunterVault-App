using System.Security.Claims;
using HunterVault.Api.Data;
using HunterVault.Api.Dtos;
using HunterVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Api.Endpoints;

using HunterVault.Api.Entities;

public static class ProfileEndpoints
{
    private static int CalculateLevel(IEnumerable<Game> games)
    {
        double totalXp = 0;
        foreach (var game in games)
        {
            double gameXp = (game.TrophyPercentage ?? 0) * 10;
            if (game.Status == GameStatus.Completed) gameXp += 500;
            if (game.Status == GameStatus.Platinumed) gameXp += 2000;
            double difficultyMultiplier = 1.0 + ((game.DifficultyRating ?? 0) * 0.1);
            totalXp += (gameXp * difficultyMultiplier);
        }
        return (int)Math.Max(1, Math.Sqrt(totalXp / 100));
    }

    private static (int level, int totalXp, int nextLevelXp) GetXpStats(IEnumerable<Game> games)
    {
        double totalXp = 0;
        foreach (var game in games)
        {
            double gameXp = (game.TrophyPercentage ?? 0) * 10;
            if (game.Status == GameStatus.Completed) gameXp += 500;
            if (game.Status == GameStatus.Platinumed) gameXp += 2000;
            double difficultyMultiplier = 1.0 + ((game.DifficultyRating ?? 0) * 0.1);
            totalXp += (gameXp * difficultyMultiplier);
        }
        int currentLevel = (int)Math.Max(1, Math.Sqrt(totalXp / 100));
        double xpForNextLevel = Math.Pow(currentLevel + 1, 2) * 100;
        return (currentLevel, (int)totalXp, (int)xpForNextLevel);
    }
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

            var stats = GetXpStats(games);

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
                id = user.Id,
                username = user.Username,
                bio = user.Bio,
                avatarUrl = user.AvatarUrl,
                bannerUrl = user.BannerUrl,
                level = stats.level,
                totalXp = stats.totalXp,
                nextLevelXp = stats.nextLevelXp,
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

        // GET /api/profile/search?query=...
        group.MapGet("/search", async (string query, ClaimsPrincipal principal, HunterVaultContext dbContext) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out Guid userId)) return Results.Unauthorized();

            var users = await dbContext.Users
                .Where(u => u.Username.ToLower().Contains(query.ToLower()) && u.Id != userId)
                .Include(u => u.Games)
                .Include(u => u.Followers)
                .Take(10)
                .ToListAsync();

            var results = users.Select(u => new
            {
                u.Id,
                u.Username,
                u.AvatarUrl,
                Level = CalculateLevel(u.Games),
                IsFollowing = u.Followers.Any(f => f.FollowerId == userId)
            });

            return Results.Ok(results);
        }).RequireAuthorization();

        // POST /api/profile/follow/{targetUserId}
        group.MapPost("/follow/{targetUserId}", async (Guid targetUserId, ClaimsPrincipal principal, HunterVaultContext dbContext) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out Guid userId)) return Results.Unauthorized();

            if (userId == targetUserId) return Results.BadRequest("You cannot follow yourself.");

            var exists = await dbContext.UserFollows.AnyAsync(f => f.FollowerId == userId && f.FollowingId == targetUserId);
            if (exists) return Results.Ok(new { message = "Already following." });

            dbContext.UserFollows.Add(new UserFollow { FollowerId = userId, FollowingId = targetUserId });
            await dbContext.SaveChangesAsync();

            return Results.Ok(new { message = "Followed successfully." });
        }).RequireAuthorization();

        // DELETE /api/profile/unfollow/{targetUserId}
        group.MapDelete("/follow/{targetUserId}", async (Guid targetUserId, ClaimsPrincipal principal, HunterVaultContext dbContext) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out Guid userId)) return Results.Unauthorized();

            var follow = await dbContext.UserFollows.FindAsync(userId, targetUserId);
            if (follow is null) return Results.NotFound();

            dbContext.UserFollows.Remove(follow);
            await dbContext.SaveChangesAsync();

            return Results.Ok(new { message = "Unfollowed successfully." });
        }).RequireAuthorization();

        // GET /api/profile/feed
        group.MapGet("/feed", async (ClaimsPrincipal principal, HunterVaultContext dbContext, int page = 1, int pageSize = 10) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out Guid userId)) return Results.Unauthorized();

            var followingIds = await dbContext.UserFollows
                .Where(f => f.FollowerId == userId)
                .Select(f => f.FollowingId)
                .ToListAsync();

            if (!followingIds.Any()) return Results.Ok(Enumerable.Empty<object>());

            var updates = await dbContext.Games
                .Include(g => g.User)
                .Where(g => followingIds.Contains(g.UserId))
                .OrderByDescending(g => g.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            var feed = updates.Select(g => new
            {
                g.Id,
                g.Name,
                g.Status,
                g.TrophyPercentage,
                g.UpdatedAt,
                User = new
                {
                    g.User?.Username,
                    g.User?.AvatarUrl
                }
            });

            return Results.Ok(feed);
        }).RequireAuthorization();

        // GET /api/profile/recommended
        group.MapGet("/recommended", async (ClaimsPrincipal principal, HunterVaultContext dbContext) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out Guid userId)) return Results.Unauthorized();

            var followedIds = await dbContext.UserFollows
                .Where(f => f.FollowerId == userId)
                .Select(f => f.FollowingId)
                .ToListAsync();

            var potentialRecommendations = await dbContext.Users
                .Where(u => u.Id != userId && !followedIds.Contains(u.Id))
                .Include(u => u.Games)
                .OrderByDescending(u => u.Id) // Basic initial sort
                .Take(50) // Limit potential candidates for performance
                .ToListAsync();

            var recommendations = potentialRecommendations
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.AvatarUrl,
                    Level = CalculateLevel(u.Games)
                })
                .OrderByDescending(r => r.Level)
                .Take(5);

            return Results.Ok(recommendations);
        }).RequireAuthorization();
    }
}
