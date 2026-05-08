using HunterVault.Application.Abstractions.Persistence;
using HunterVault.Application.Abstractions.Profile;
using HunterVault.Application.Dtos.Games;
using HunterVault.Application.Dtos.Profile;
using HunterVault.Domain.Rules;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Application.Services.Profile;

public class ProfileService(IHunterVaultDbContext db) : IProfileService
{
    public async Task<PublicProfileDto?> GetPublicProfileAsync(string username, CancellationToken cancellationToken = default)
    {
        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);

        if (user is null) return null;

        var games = await db.Games
            .AsNoTracking()
            .Where(g => g.UserId == user.Id)
            .ToListAsync(cancellationToken);

        var stats = XpCalculator.CalculateStats(games);

        var gameDtos = games.Select(g => new GameSummaryDto(
            g.Id, g.Name, g.Genres, g.Platform, g.Status, g.HoursPlayed,
            g.DifficultyRating, g.TrophyPercentage, g.CoverUrl, g.Review, g.IgdbId)).ToList();

        return new PublicProfileDto(
            user.Id, user.Username, user.Bio, user.AvatarUrl, user.BannerUrl,
            stats.Level, stats.TotalXp, stats.NextLevelXp, games.Count, gameDtos);
    }

    public async Task<bool> UpdateProfileAsync(Guid userId, UpdateProfileDto dto, CancellationToken cancellationToken = default)
    {
        var user = await db.Users.FindAsync([userId], cancellationToken);
        if (user is null) return false;

        user.Bio = dto.Bio;
        user.AvatarUrl = dto.AvatarUrl;
        user.BannerUrl = dto.BannerUrl;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<UserSearchResultDto>> SearchUsersAsync(string query, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var q = (query ?? string.Empty).ToLower();

        var users = await db.Users
            .Where(u => u.Username.ToLower().Contains(q) && u.Id != currentUserId)
            .Include(u => u.Games)
            .Include(u => u.Followers)
            .Take(10)
            .ToListAsync(cancellationToken);

        return users.Select(u => new UserSearchResultDto(
            u.Id, u.Username, u.AvatarUrl,
            XpCalculator.CalculateLevel(u.Games),
            u.Followers.Any(f => f.FollowerId == currentUserId))).ToList();
    }

    public async Task<IReadOnlyList<RecommendedUserDto>> GetRecommendedAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var followedIds = await db.UserFollows
            .Where(f => f.FollowerId == userId)
            .Select(f => f.FollowingId)
            .ToListAsync(cancellationToken);

        var candidates = await db.Users
            .Where(u => u.Id != userId && !followedIds.Contains(u.Id))
            .Include(u => u.Games)
            .OrderByDescending(u => u.Id)
            .Take(50)
            .ToListAsync(cancellationToken);

        return candidates
            .Select(u => new RecommendedUserDto(u.Id, u.Username, u.AvatarUrl, XpCalculator.CalculateLevel(u.Games)))
            .OrderByDescending(r => r.Level)
            .Take(5)
            .ToList();
    }
}