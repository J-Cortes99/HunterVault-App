using HunterVault.Domain.Enums;

namespace HunterVault.Domain.Rules;

public static class GameRules
{
    public static int? NormalizeTrophyPercentage(GameStatus status, int? rawValue) => status switch
    {
        GameStatus.Platinumed => 100,
        GameStatus.Backlog or GameStatus.Dropped => null,
        _ => rawValue
    };
}
