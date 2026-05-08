using System.ComponentModel.DataAnnotations;

namespace HunterVault.Application.Dtos.Auth;

public class ForgotPasswordDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
