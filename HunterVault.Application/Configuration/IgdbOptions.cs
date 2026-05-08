namespace HunterVault.Application.Configuration;

public class IgdbOptions
{
    public const string SectionName = "IgdbApi";

    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}
