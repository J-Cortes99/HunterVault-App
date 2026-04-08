using System.ComponentModel.DataAnnotations;

namespace HunterVault.Api.Entities;

public class UserDto
{
    [Required]
    [StringLength(20, MinimumLength = 3, ErrorMessage = "El nombre de usuario debe tener entre 3 y 20 caracteres.")]
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

}
