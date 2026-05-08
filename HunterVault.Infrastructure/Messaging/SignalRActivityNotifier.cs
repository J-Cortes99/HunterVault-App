using HunterVault.Application.Abstractions.Messaging;
using HunterVault.Domain.Enums;
using Microsoft.AspNetCore.SignalR;

namespace HunterVault.Infrastructure.Messaging;

public class SignalRActivityNotifier(IHubContext<SocialHub> hubContext) : IActivityNotifier
{
    public Task NotifyUsersAsync(
        IReadOnlyCollection<Guid> recipientUserIds,
        string actorUsername,
        string gameName,
        GameStatus status,
        int? trophyPercentage,
        CancellationToken cancellationToken = default)
    {
        if (recipientUserIds.Count == 0) return Task.CompletedTask;

        var userIds = recipientUserIds.Select(id => id.ToString()).ToList();
        return hubContext.Clients.Users(userIds).SendAsync(
            "ReceiveActivityUpdate",
            actorUsername,
            gameName,
            (int)status,
            trophyPercentage,
            cancellationToken);
    }
}
