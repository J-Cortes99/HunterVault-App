namespace HunterVault.Application.Dtos.Profile;

public record RecommendedUserDto(
    Guid Id,
    string Username,
    string? AvatarUrl,
    int Level
);
