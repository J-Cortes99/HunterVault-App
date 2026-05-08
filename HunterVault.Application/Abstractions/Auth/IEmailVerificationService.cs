using HunterVault.Application.Dtos.Auth;

namespace HunterVault.Application.Abstractions.Auth;

public interface IEmailVerificationService
{
    Task<bool> VerifyEmailAsync(EmailVerificationDto request, CancellationToken cancellationToken = default);
}
