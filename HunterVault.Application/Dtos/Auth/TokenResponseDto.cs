namespace HunterVault.Application.Dtos.Auth;

public class TokenResponseDto
{
    public required string AccessToken { get; set; } = string.Empty;
    public required string? RefreshToken { get; set; }
}
