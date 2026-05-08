namespace HunterVault.Application.Abstractions.Profile;

public enum FollowResult
{
    Followed,
    AlreadyFollowing,
    CannotFollowSelf
}

public enum UnfollowResult
{
    Unfollowed,
    NotFollowing
}

public interface IFollowService
{
    Task<FollowResult> FollowAsync(Guid followerId, Guid targetId, CancellationToken cancellationToken = default);
    Task<UnfollowResult> UnfollowAsync(Guid followerId, Guid targetId, CancellationToken cancellationToken = default);
}
