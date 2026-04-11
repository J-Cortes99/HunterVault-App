using System.ComponentModel.DataAnnotations;

namespace HunterVault.Api.Models;

public class EmailVerificationDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "El código debe tener exactamente 6 dígitos.")]
    public string Code { get; set; } = string.Empty;
}
