using HunterVault.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Application.Abstractions.Persistence;

public interface IHunterVaultDbContext
{
    DbSet<User> Users { get; }
    DbSet<Game> Games { get; }
    DbSet<UserFollow> UserFollows { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
