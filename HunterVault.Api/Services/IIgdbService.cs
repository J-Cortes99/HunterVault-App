namespace HunterVault.Api.Services;

public interface IIgdbService
{
    Task<(string? CoverUrl, List<string> Genres)> GetGameDetailsAsync(string gameName);
    Task<List<IgdbGameResponse>> SearchGamesAsync(string query);
}
