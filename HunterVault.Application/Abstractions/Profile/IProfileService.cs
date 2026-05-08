using HunterVault.Application.Dtos.Profile;

namespace HunterVault.Application.Abstractions.Profile;

public interface IProfileService
{
    Task<PublicProfileDto?> GetPublicProfileAsync(string username, CancellationToken cancellationToken = default);
    Task<bool> UpdateProfileAsync(Guid userId, UpdateProfileDto dto, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserSearchResultDto>> SearchUsersAsync(string query, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RecommendedUserDto>> GetRecommendedAsync(Guid userId, CancellationToken cancellationToken = default);
}
