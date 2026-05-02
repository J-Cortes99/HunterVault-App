using System.ComponentModel.DataAnnotations;

namespace HunterVault.Api.Models;

public class ForgotPasswordDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
