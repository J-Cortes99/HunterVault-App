using HunterVault.Application.Dtos.Games;

namespace HunterVault.Application.Dtos.Profile;

public record PublicProfileDto(
    Guid Id,
    string Username,
    string? Bio,
    string? AvatarUrl,
    string? BannerUrl,
    int Level,
    int TotalXp,
    int NextLevelXp,
    int TotalGames,
    IReadOnlyList<GameSummaryDto> Games
);
