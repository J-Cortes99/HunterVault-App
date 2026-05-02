using HunterVault.Api.Entities;
using HunterVault.Api.Models;

namespace HunterVault.Api.Services;

public interface IAuthService
{
    Task<User?> RegisterAsync(UserDto request);
    Task<TokenResponseDto?> LoginAsync(UserDto request);
    Task<TokenResponseDto?> RefreshTokenAsync(RefreshTokenRequestDto request);
    Task<bool> VerifyEmailAsync(EmailVerificationDto request);
    Task<bool> IsUsernameAvailableAsync(string username);
    Task ForgotPasswordAsync(ForgotPasswordDto request);
    Task<bool> ResetPasswordAsync(ResetPasswordDto request);
}
