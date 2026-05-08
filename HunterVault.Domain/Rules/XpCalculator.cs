using HunterVault.Domain.Entities;
using HunterVault.Domain.Enums;

namespace HunterVault.Domain.Rules;

public readonly record struct XpStats(int Level, int TotalXp, int NextLevelXp);

public static class XpCalculator
{
    public static int CalculateLevel(IEnumerable<Game> games) =>
        ToLevel(SumXp(games));

    public static XpStats CalculateStats(IEnumerable<Game> games)
    {
        var totalXp = SumXp(games);
        var level = ToLevel(totalXp);
        var nextLevelXp = Math.Pow(level + 1, 2) * 100;
        return new XpStats(level, (int)totalXp, (int)nextLevelXp);
    }

    private static double SumXp(IEnumerable<Game> games)
    {
        double totalXp = 0;
        foreach (var game in games)
            totalXp += XpFor(game);
        return totalXp;
    }

    private static double XpFor(Game game)
    {
        double xp = (game.TrophyPercentage ?? 0) * 10;
        if (game.Status == GameStatus.Completed) xp += 500;
        if (game.Status == GameStatus.Platinumed) xp += 2000;
        var difficultyMultiplier = 1.0 + ((game.DifficultyRating ?? 0) * 0.1);
        return xp * difficultyMultiplier;
    }

    private static int ToLevel(double totalXp) =>
        (int)Math.Max(1, Math.Sqrt(totalXp / 100));
}
