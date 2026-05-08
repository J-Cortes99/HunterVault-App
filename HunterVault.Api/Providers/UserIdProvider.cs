using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace HunterVault.Api.Providers;

public class UserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection) =>
        connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
}
