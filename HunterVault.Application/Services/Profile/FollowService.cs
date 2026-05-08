using HunterVault.Application.Abstractions.Persistence;
using HunterVault.Application.Abstractions.Profile;
using HunterVault.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Application.Services.Profile;

public class FollowService(IHunterVaultDbContext db) : IFollowService
{
    public async Task<FollowResult> FollowAsync(Guid followerId, Guid targetId, CancellationToken cancellationToken = default)
    {
        if (followerId == targetId) return FollowResult.CannotFollowSelf;

        var exists = await db.UserFollows
            .AnyAsync(f => f.FollowerId == followerId && f.FollowingId == targetId, cancellationToken);

        if (exists) return FollowResult.AlreadyFollowing;

        db.UserFollows.Add(new UserFollow { FollowerId = followerId, FollowingId = targetId });
        await db.SaveChangesAsync(cancellationToken);

        return FollowResult.Followed;
    }

    public async Task<UnfollowResult> UnfollowAsync(Guid followerId, Guid targetId, CancellationToken cancellationToken = default)
    {
        var follow = await db.UserFollows.FindAsync([followerId, targetId], cancellationToken);
        if (follow is null) return UnfollowResult.NotFollowing;

        db.UserFollows.Remove(follow);
        await db.SaveChangesAsync(cancellationToken);

        return UnfollowResult.Unfollowed;
    }
}