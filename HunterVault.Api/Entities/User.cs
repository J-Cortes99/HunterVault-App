using System.ComponentModel.DataAnnotations;
using HunterVault.Api.Models;

namespace HunterVault.Api.Entities;

public class User
{
    public Guid Id { get; set; }
    [MaxLength(20)]
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    public ICollection<Game> Games { get; set; } = new List<Game>();
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public string? BannerUrl { get; set; }
    public ICollection<UserFollow> Followers { get; set; } = new List<UserFollow>();
    public ICollection<UserFollow> Following { get; set; } = new List<UserFollow>();

    // Email verification
    [MaxLength(254)]
    public string? Email { get; set; }
    public bool EmailVerified { get; set; } = false;
    public string? EmailVerificationCode { get; set; }
    public DateTime? EmailVerificationCodeExpiry { get; set; }

    // Password reset
    public string? PasswordResetCode { get; set; }
    public DateTime? PasswordResetCodeExpiry { get; set; }
}
