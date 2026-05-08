using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace HunterVault.Infrastructure.Messaging;

public class SocialHub(ILogger<SocialHub> logger) : Hub
{
    public override Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        var username = Context.User?.Identity?.Name;
        logger.LogInformation("[SignalR] Usuario conectado: {Username} (ID: {UserId})", username, userId);
        return base.OnConnectedAsync();
    }
}
