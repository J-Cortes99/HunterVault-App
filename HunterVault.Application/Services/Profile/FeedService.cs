using HunterVault.Application.Abstractions.Persistence;
using HunterVault.Application.Abstractions.Profile;
using HunterVault.Application.Dtos.Profile;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Application.Services.Profile;

public class FeedService(IHunterVaultDbContext db) : IFeedService
{
    public async Task<IReadOnlyList<FeedItemDto>> GetFeedAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var followingIds = await db.UserFollows
            .Where(f => f.FollowerId == userId)
            .Select(f => f.FollowingId)
            .ToListAsync(cancellationToken);

        if (followingIds.Count == 0) return Array.Empty<FeedItemDto>();

        return await db.Games
            .Include(g => g.User)
            .Where(g => followingIds.Contains(g.UserId))
            .OrderByDescending(g => g.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .Select(g => new FeedItemDto(
                g.Id,
                g.Name,
                g.Status,
                g.TrophyPercentage,
                g.UpdatedAt,
                new FeedItemUserDto(g.User!.Username, g.User.AvatarUrl)))
            .ToListAsync(cancellationToken);
    }
}