using Microsoft.AspNetCore.SignalR;

namespace HunterVault.Api.Hubs;

public class SocialHub : Hub
{
    // Basic hub for real-time notifications. 
    // We can add logic to join groups of followers later if needed, 
    // but a simple "ActivityUpdated" broadcast is a good start.
    public override Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        var username = Context.User?.Identity?.Name;
        Console.WriteLine($"[SignalR] Usuario conectado: {username} (ID: {userId})");
        return base.OnConnectedAsync();
    }

    public async Task SendActivityUpdate(string username, string gameName)
    {
        await Clients.All.SendAsync("ReceiveActivityUpdate", username, gameName);
    }
}
