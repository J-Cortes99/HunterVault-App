namespace HunterVault.Api.Services;

public interface IIgdbService
{
    Task<string?> GetGameCoverUrlAsync(string gameName);
}
