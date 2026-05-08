using HunterVault.Application.Abstractions.External;
using HunterVault.Application.Abstractions.Games;
using HunterVault.Application.Abstractions.Messaging;
using HunterVault.Application.Abstractions.Persistence;
using HunterVault.Application.Abstractions.Time;
using HunterVault.Application.Dtos.Games;
using HunterVault.Domain.Entities;
using HunterVault.Domain.Rules;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Application.Services.Games;

public class GameService(
    IHunterVaultDbContext db,
    IIgdbService igdb,
    IActivityNotifier notifier,
    IClock clock) : IGameService
{
    public async Task<IReadOnlyList<GameSummaryDto>> GetAllForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await db.Games
            .Where(g => g.UserId == userId)
            .AsNoTracking()
            .Select(g => new GameSummaryDto(
                g.Id, g.Name, g.Genres, g.Platform, g.Status, g.HoursPlayed,
                g.DifficultyRating, g.TrophyPercentage, g.CoverUrl, g.Review, g.IgdbId))
            .ToListAsync(cancellationToken);
    }

    public async Task<GameDetailsDto?> GetByIdAsync(int id, Guid userId, CancellationToken cancellationToken = default)
    {
        var game = await db.Games
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId, cancellationToken);

        return game is null ? null : MapDetails(game);
    }

    public async Task<GameDetailsDto> CreateAsync(CreateGameDto input, Guid userId, string actorUsername, CancellationToken cancellationToken = default)
    {
        var game = new Game
        {
            Name = input.Name,
            Platform = input.Platform,
            Status = input.Status,
            HoursPlayed = input.HoursPlayed,
            DifficultyRating = input.DifficultyRating,
            TrophyPercentage = GameRules.NormalizeTrophyPercentage(input.Status, input.TrophyPercentage),
            Review = input.Review,
            UserId = userId,
            IgdbId = input.IgdbId,
            UpdatedAt = clock.UtcNow
        };

        await EnrichFromIgdbAsync(game, cancellationToken);

        db.Games.Add(game);
        await db.SaveChangesAsync(cancellationToken);

        await NotifyFollowersAsync(userId, actorUsername, game, cancellationToken);

        return MapDetails(game);
    }

    public async Task<bool> UpdateAsync(int id, UpdateGameDto input, Guid userId, string actorUsername, CancellationToken cancellationToken = default)
    {
        var existing = await db.Games.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId, cancellationToken);
        if (existing is null) return false;

        var nameOrIgdbChanged = existing.Name != input.Name
            || existing.IgdbId != input.IgdbId
            || string.IsNullOrEmpty(existing.CoverUrl);

        if (nameOrIgdbChanged)
        {
            existing.Name = input.Name;
            existing.IgdbId = input.IgdbId;
            await EnrichFromIgdbAsync(existing, cancellationToken);
        }

        existing.Platform = input.Platform;
        existing.Status = input.Status;
        existing.HoursPlayed = input.HoursPlayed;
        existing.DifficultyRating = input.DifficultyRating;
        existing.TrophyPercentage = GameRules.NormalizeTrophyPercentage(input.Status, input.TrophyPercentage);
        existing.Review = input.Review;
        existing.UpdatedAt = clock.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        await NotifyFollowersAsync(userId, actorUsername, existing, cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(int id, Guid userId, CancellationToken cancellationToken = default)
    {
        var deleted = await db.Games
            .Where(g => g.Id == id && g.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        return deleted > 0;
    }

    private async Task EnrichFromIgdbAsync(Game game, CancellationToken cancellationToken)
    {
        if (!game.IgdbId.HasValue) return;

        var details = await igdb.GetFullGameDetailsByIdAsync(game.IgdbId.Value, cancellationToken);
        if (details is null) return;

        game.CoverUrl = details.CoverUrl;
        game.Genres = details.Genres;
        if (game.IgdbId is null or 0)
            game.IgdbId = details.Id;
    }

    private async Task NotifyFollowersAsync(Guid userId, string actorUsername, Game game, CancellationToken cancellationToken)
    {
        var followerIds = await db.UserFollows
            .Where(f => f.FollowingId == userId)
            .Select(f => f.FollowerId)
            .ToListAsync(cancellationToken);

        if (followerIds.Count == 0) return;

        await notifier.NotifyUsersAsync(followerIds, actorUsername, game.Name, game.Status, game.TrophyPercentage, cancellationToken);
    }

    private static GameDetailsDto MapDetails(Game g) => new(
        g.Id, g.Name, g.Genres, g.Platform, g.Status, g.HoursPlayed,
        g.DifficultyRating, g.TrophyPercentage, g.CoverUrl, g.Review, g.IgdbId);
}