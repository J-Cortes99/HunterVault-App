using HunterVault.Application.Dtos.Games;

namespace HunterVault.Application.Abstractions.Games;

public interface IGameService
{
    Task<IReadOnlyList<GameSummaryDto>> GetAllForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<GameDetailsDto?> GetByIdAsync(int id, Guid userId, CancellationToken cancellationToken = default);
    Task<GameDetailsDto> CreateAsync(CreateGameDto input, Guid userId, string actorUsername, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(int id, UpdateGameDto input, Guid userId, string actorUsername, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, Guid userId, CancellationToken cancellationToken = default);
}
