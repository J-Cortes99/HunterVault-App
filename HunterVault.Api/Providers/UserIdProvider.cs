using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace HunterVault.Api.Providers;

public class UserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        // SignalR will use this string to identify users.
        // We use the NameIdentifier claim which contains the User Guid.
        return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
