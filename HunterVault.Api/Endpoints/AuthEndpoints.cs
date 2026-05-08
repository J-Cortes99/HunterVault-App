using HunterVault.Api.Configuration;
using HunterVault.Application.Abstractions.Auth;
using HunterVault.Application.Dtos.Auth;
using Microsoft.AspNetCore.Authorization;

namespace HunterVault.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/Auth").RequireRateLimiting(RateLimitingConfiguration.Auth);

        group.MapGet("/check-username", async (string username, IRegistrationService registration, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(username) || username.Length < 3 || username.Length > 20)
                return Results.Ok(new { available = false });

            var available = await registration.IsUsernameAvailableAsync(username.Trim(), ct);
            return Results.Ok(new { available });
        }).RequireRateLimiting(RateLimitingConfiguration.Search);

        group.MapPost("/register", async (UserDto request, IRegistrationService registration, CancellationToken ct) =>
        {
            var result = await registration.RegisterAsync(request, ct);
            if (!result.Succeeded)
                return Results.BadRequest("El usuario o el email ya existe.");

            if (!string.IsNullOrWhiteSpace(request.Email))
                return Results.Ok(new { requiresVerification = true, email = request.Email });

            return Results.Ok(result.User);
        });

        group.MapPost("/verify-email", async (EmailVerificationDto request, IEmailVerificationService verifier, CancellationToken ct) =>
        {
            var ok = await verifier.VerifyEmailAsync(request, ct);
            return ok
                ? Results.Ok(new { message = "Email verificado correctamente. Ya puedes iniciar sesión." })
                : Results.BadRequest("Código inválido o expirado.");
        });

        group.MapPost("/login", async (UserDto request, IAuthenticationService auth, CancellationToken ct) =>
        {
            var result = await auth.LoginAsync(request, ct);
            return result is null
                ? Results.BadRequest("Invalid username or password.")
                : Results.Ok(result);
        });

        group.MapPost("/refresh", async (RefreshTokenRequestDto request, IAuthenticationService auth, CancellationToken ct) =>
        {
            var result = await auth.RefreshTokenAsync(request, ct);
            return result is null
                ? Results.BadRequest("Invalid refresh token.")
                : Results.Ok(result);
        });

        group.MapPost("/forgot-password", async (ForgotPasswordDto request, IPasswordResetService reset, CancellationToken ct) =>
        {
            await reset.ForgotPasswordAsync(request, ct);
            return Results.Ok(new { message = "Si el email está registrado, recibirás un código para restablecer tu contraseña." });
        });

        group.MapPost("/reset-password", async (ResetPasswordDto request, IPasswordResetService reset, CancellationToken ct) =>
        {
            var ok = await reset.ResetPasswordAsync(request, ct);
            return ok
                ? Results.Ok(new { message = "Contraseña restablecida correctamente. Ya puedes iniciar sesión." })
                : Results.BadRequest("Código inválido o expirado.");
        });

        group.MapGet("/", [Authorize] () => Results.Ok("You are authenticated!"));
        group.MapGet("/admin", [Authorize(Roles = "Admin")] () => Results.Ok("You are an admin!"));
    }
}
