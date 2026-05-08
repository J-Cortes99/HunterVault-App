using HunterVault.Application.Dtos.Profile;

namespace HunterVault.Application.Abstractions.Profile;

public interface IFeedService
{
    Task<IReadOnlyList<FeedItemDto>> GetFeedAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);
}
