using HunterVault.Application.Abstractions.Persistence;
using HunterVault.Application.Abstractions.Auth;
using HunterVault.Application.Abstractions.Time;
using HunterVault.Application.Dtos.Auth;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Application.Services.Auth;

public class EmailVerificationService(
    IHunterVaultDbContext db,
    IClock clock) : IEmailVerificationService
{
    public async Task<bool> VerifyEmailAsync(EmailVerificationDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (user is null) return false;

        if (user.EmailVerified) return true;

        if (user.EmailVerificationCode != request.Code) return false;
        if (user.EmailVerificationCodeExpiry < clock.UtcNow) return false;

        user.EmailVerified = true;
        user.EmailVerificationCode = null;
        user.EmailVerificationCodeExpiry = null;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}