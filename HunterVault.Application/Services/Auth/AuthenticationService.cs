using HunterVault.Application.Abstractions.Identity;
using HunterVault.Application.Abstractions.Auth;
using HunterVault.Application.Abstractions.Persistence;
using HunterVault.Application.Abstractions.Time;
using HunterVault.Application.Configuration;
using HunterVault.Application.Dtos.Auth;
using HunterVault.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace HunterVault.Application.Services.Auth;

public class AuthenticationService(
    IHunterVaultDbContext db,
    IPasswordHasher passwordHasher,
    IJwtTokenGenerator tokenGenerator,
    IClock clock,
    IOptions<JwtOptions> jwtOptions) : IAuthenticationService
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    public async Task<TokenResponseDto?> LoginAsync(UserDto request, CancellationToken cancellationToken = default)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username, cancellationToken);
        if (user is null) return null;

        if (!passwordHasher.Verify(user, user.PasswordHash, request.Password))
            return null;

        return await IssueTokensAsync(user, cancellationToken);
    }

    public async Task<TokenResponseDto?> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await db.Users.FindAsync([request.UserId], cancellationToken);
        if (user is null) return null;

        if (user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= clock.UtcNow)
            return null;

        return await IssueTokensAsync(user, cancellationToken);
    }

    private async Task<TokenResponseDto> IssueTokensAsync(User user, CancellationToken cancellationToken)
    {
        var accessToken = tokenGenerator.GenerateAccessToken(user);
        var refreshToken = tokenGenerator.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = clock.UtcNow.AddDays(_jwt.RefreshTokenLifetimeDays);

        await db.SaveChangesAsync(cancellationToken);

        return new TokenResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };
    }
}