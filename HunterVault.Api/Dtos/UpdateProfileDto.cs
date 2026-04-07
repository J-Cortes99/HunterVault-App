namespace HunterVault.Api.Dtos;

public record UpdateProfileDto(
    string? Bio,
    string? AvatarUrl,
    string? BannerUrl
);
