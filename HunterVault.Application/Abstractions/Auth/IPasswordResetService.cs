using HunterVault.Application.Dtos.Auth;

namespace HunterVault.Application.Abstractions.Auth;

public interface IPasswordResetService
{
    Task ForgotPasswordAsync(ForgotPasswordDto request, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(ResetPasswordDto request, CancellationToken cancellationToken = default);
}
