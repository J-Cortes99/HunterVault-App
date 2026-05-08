namespace HunterVault.Application.Configuration;

public class JwtOptions
{
    public const string SectionName = "AppSettings";

    public string Token { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int AccessTokenLifetimeDays { get; set; } = 1;
    public int RefreshTokenLifetimeDays { get; set; } = 7;
}
