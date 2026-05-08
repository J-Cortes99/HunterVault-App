using HunterVault.Application.Abstractions.Identity;
using HunterVault.Application.Abstractions.Auth;
using HunterVault.Application.Abstractions.Messaging;
using HunterVault.Application.Abstractions.Persistence;
using HunterVault.Application.Abstractions.Time;
using HunterVault.Application.Dtos.Auth;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Application.Services.Auth;

public class PasswordResetService(
    IHunterVaultDbContext db,
    IPasswordHasher passwordHasher,
    IEmailSender emailSender,
    IVerificationCodeGenerator codeGenerator,
    IClock clock) : IPasswordResetService
{
    private const int ResetCodeLifetimeMinutes = 15;

    public async Task ForgotPasswordAsync(ForgotPasswordDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        if (user is null) return;

        var code = codeGenerator.Generate();
        user.PasswordResetCode = code;
        user.PasswordResetCodeExpiry = clock.UtcNow.AddMinutes(ResetCodeLifetimeMinutes);

        await db.SaveChangesAsync(cancellationToken);
        await emailSender.SendPasswordResetCodeAsync(user.Email!, code, cancellationToken);
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (user is null) return false;

        if (string.IsNullOrEmpty(user.PasswordResetCode) || user.PasswordResetCode != request.Code)
            return false;

        if (user.PasswordResetCodeExpiry is null || user.PasswordResetCodeExpiry < clock.UtcNow)
            return false;

        user.PasswordHash = passwordHasher.Hash(user, request.NewPassword);
        user.PasswordResetCode = null;
        user.PasswordResetCodeExpiry = null;
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}