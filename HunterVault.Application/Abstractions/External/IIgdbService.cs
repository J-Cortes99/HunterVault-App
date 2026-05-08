using HunterVault.Application.Dtos.Igdb;

namespace HunterVault.Application.Abstractions.External;

public interface IIgdbService
{
    Task<IReadOnlyList<IgdbSearchResultDto>> SearchGamesAsync(string query, CancellationToken cancellationToken = default);
    Task<IgdbGameDetailsDto?> GetFullGameDetailsByIdAsync(int igdbId, CancellationToken cancellationToken = default);
}
