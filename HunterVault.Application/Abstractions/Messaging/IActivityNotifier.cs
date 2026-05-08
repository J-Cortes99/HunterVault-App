using HunterVault.Domain.Enums;

namespace HunterVault.Application.Abstractions.Messaging;

public interface IActivityNotifier
{
    Task NotifyUsersAsync(
        IReadOnlyCollection<Guid> recipientUserIds,
        string actorUsername,
        string gameName,
        GameStatus status,
        int? trophyPercentage,
        CancellationToken cancellationToken = default);
}
