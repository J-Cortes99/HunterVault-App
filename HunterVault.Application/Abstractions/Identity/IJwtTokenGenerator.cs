using HunterVault.Domain.Entities;

namespace HunterVault.Application.Abstractions.Identity;

public interface IJwtTokenGenerator
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}
