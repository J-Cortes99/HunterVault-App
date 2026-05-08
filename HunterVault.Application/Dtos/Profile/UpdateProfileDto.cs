namespace HunterVault.Application.Dtos.Profile;

public record UpdateProfileDto(
    string? Bio,
    string? AvatarUrl,
    string? BannerUrl
);
