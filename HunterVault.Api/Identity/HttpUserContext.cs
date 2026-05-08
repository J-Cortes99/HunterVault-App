using System.Security.Claims;
using HunterVault.Application.Abstractions.Identity;

namespace HunterVault.Api.Identity;

public class HttpUserContext(IHttpContextAccessor accessor) : IUserContext
{
    public Guid? UserId
    {
        get
        {
            var value = accessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public string? Username =>
        accessor.HttpContext?.User?.Identity?.Name
        ?? accessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);
}
