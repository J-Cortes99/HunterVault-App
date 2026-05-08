namespace HunterVault.Application.Dtos.Auth;

public class RefreshTokenRequestDto
{
    public Guid UserId { get; set; }
    public string RefreshToken { get; set; } = string.Empty;
}
