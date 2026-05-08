namespace HunterVault.Application.Dtos.Profile;

public record UserSearchResultDto(
    Guid Id,
    string Username,
    string? AvatarUrl,
    int Level,
    bool IsFollowing
);
