using HunterVault.Application.Abstractions.Identity;
using HunterVault.Application.Abstractions.Auth;
using HunterVault.Application.Abstractions.Messaging;
using HunterVault.Application.Abstractions.Persistence;
using HunterVault.Application.Abstractions.Time;
using HunterVault.Application.Dtos.Auth;
using HunterVault.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Application.Services.Auth;

public class RegistrationService(
    IHunterVaultDbContext db,
    IPasswordHasher passwordHasher,
    IEmailSender emailSender,
    IVerificationCodeGenerator codeGenerator,
    IClock clock) : IRegistrationService
{
    private const int VerificationCodeLifetimeMinutes = 15;

    public async Task<RegistrationResult> RegisterAsync(UserDto request, CancellationToken cancellationToken = default)
    {
        if (await db.Users.AnyAsync(u => u.Username == request.Username, cancellationToken))
            return RegistrationResult.Failed(RegistrationFailure.UsernameTaken);

        var hasEmail = !string.IsNullOrWhiteSpace(request.Email);
        var normalizedEmail = hasEmail ? request.Email!.ToLowerInvariant() : null;

        if (hasEmail && await db.Users.AnyAsync(u => u.Email == normalizedEmail, cancellationToken))
            return RegistrationResult.Failed(RegistrationFailure.EmailTaken);

        var user = new User
        {
            Username = request.Username
        };
        user.PasswordHash = passwordHasher.Hash(user, request.Password);

        if (hasEmail)
        {
            user.Email = normalizedEmail;
            user.EmailVerified = false;
            user.EmailVerificationCode = codeGenerator.Generate();
            user.EmailVerificationCodeExpiry = clock.UtcNow.AddMinutes(VerificationCodeLifetimeMinutes);
        }

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        if (hasEmail)
            await emailSender.SendVerificationCodeAsync(user.Email!, user.EmailVerificationCode!, cancellationToken);

        return RegistrationResult.Success(new RegisteredUserDto(user.Id, user.Username, user.Email, user.EmailVerified));
    }

    public Task<bool> IsUsernameAvailableAsync(string username, CancellationToken cancellationToken = default) =>
        db.Users.AllAsync(u => u.Username != username, cancellationToken);
}