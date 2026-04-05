using HunterVault.Api.Dtos;

namespace HunterVault.Api.Services;

public interface IIgdbService
{
    Task<List<IgdbGameResponse>> SearchGamesAsync(string query);
    Task<IgdbGameDetailsDto?> GetFullGameDetailsByIdAsync(int igdbId);
}
