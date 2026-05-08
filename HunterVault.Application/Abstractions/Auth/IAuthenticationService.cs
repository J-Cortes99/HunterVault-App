using HunterVault.Application.Dtos.Auth;

namespace HunterVault.Application.Abstractions.Auth;

public interface IAuthenticationService
{
    Task<TokenResponseDto?> LoginAsync(UserDto request, CancellationToken cancellationToken = default);
    Task<TokenResponseDto?> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken = default);
}
