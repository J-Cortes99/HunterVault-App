using HunterVault.Domain.Enums;

namespace HunterVault.Application.Dtos.Profile;

public record FeedItemDto(
    int Id,
    string Name,
    GameStatus Status,
    int? TrophyPercentage,
    DateTime UpdatedAt,
    FeedItemUserDto User
);

public record FeedItemUserDto(string? Username, string? AvatarUrl);
