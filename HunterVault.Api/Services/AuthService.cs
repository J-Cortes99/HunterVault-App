using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using HunterVault.Api.Data;
using HunterVault.Api.Entities;
using HunterVault.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace HunterVault.Api.Services;

public class AuthService(
    HunterVaultContext context,
    IConfiguration configuration,
    IEmailSenderService emailSender) : IAuthService
{
    public async Task<TokenResponseDto?> LoginAsync(UserDto request)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        if (user == null)
        {
            return null;
        }

        if (new PasswordHasher<User>().VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
        {
            return null;
        }

        return await CreateTokenResponse(user);
    }

    private async Task<TokenResponseDto> CreateTokenResponse(User user)
    {
        return new TokenResponseDto
        {
            AccessToken = CreateToken(user),
            RefreshToken = await GenerateAndSaveResfreshTokenAsync(user)
        };
    }

    public async Task<User?> RegisterAsync(UserDto request)
    {
        if (await context.Users.AnyAsync(u => u.Username == request.Username))
        {
            return null;
        }

        // Si se proporciona email, verificar que no esté en uso
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            if (await context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return null;
            }
        }

        var user = new User();
        var hashedPassword = new PasswordHasher<User>().HashPassword(user, request.Password);

        user.Username = request.Username;
        user.PasswordHash = hashedPassword;

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            user.Email = request.Email.ToLowerInvariant();
            user.EmailVerified = false;

            // Generar código de verificación de 6 dígitos
            var code = GenerateVerificationCode();
            user.EmailVerificationCode = code;
            user.EmailVerificationCodeExpiry = DateTime.UtcNow.AddMinutes(15);

            context.Users.Add(user);
            await context.SaveChangesAsync();

            // Enviar email con el código
            await emailSender.SendVerificationCodeAsync(user.Email, code);
        }
        else
        {
            // Registro sin email (compatibilidad con cuentas existentes)
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }

        return user;
    }

    public async Task<bool> VerifyEmailAsync(EmailVerificationDto request)
    {
        var normalizedEmail = request.Email.ToLowerInvariant();
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null)
            return false;

        if (user.EmailVerified)
            return true; // Ya estaba verificado

        if (user.EmailVerificationCode != request.Code)
            return false;

        if (user.EmailVerificationCodeExpiry < DateTime.UtcNow)
            return false; // Código expirado

        user.EmailVerified = true;
        user.EmailVerificationCode = null;
        user.EmailVerificationCodeExpiry = null;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> IsUsernameAvailableAsync(string username)
    {
        return !await context.Users.AnyAsync(u => u.Username == username);
    }

    public async Task<TokenResponseDto?> RefreshTokenAsync(RefreshTokenRequestDto request)
    {
        var user = await ValidateRefreshTokenAsync(request.UserId, request.RefreshToken);
        if (user == null)
        {
            return null;
        }

        return await CreateTokenResponse(user);
    }

    private async Task<User?> ValidateRefreshTokenAsync(Guid userId, string refreshToken)
    {
        var user = await context.Users.FindAsync(userId);
        if (user == null || user.RefreshToken != refreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return null;
        }

        return user;
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private async Task<string> GenerateAndSaveResfreshTokenAsync(User user)
    {
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await context.SaveChangesAsync();
        return refreshToken;
    }

    private static string GenerateVerificationCode()
    {
        return Random.Shared.Next(100000, 999999).ToString();
    }

    private string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration.GetValue<string>("AppSettings:Token")!));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

        var tokenDescriptor = new JwtSecurityToken(
            issuer: configuration.GetValue<string>("AppSettings:Issuer"),
            audience: configuration.GetValue<string>("AppSettings:Audience"),
            claims: claims,
            expires: DateTime.UtcNow.AddDays(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
    }
}
