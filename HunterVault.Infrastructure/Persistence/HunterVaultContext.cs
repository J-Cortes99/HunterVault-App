using HunterVault.Application.Abstractions.Persistence;
using HunterVault.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Infrastructure.Persistence;

public class HunterVaultContext(DbContextOptions<HunterVaultContext> options)
    : DbContext(options), IHunterVaultDbContext
{
    public DbSet<Game> Games => Set<Game>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserFollow> UserFollows => Set<UserFollow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserFollow>()
            .HasKey(f => new { f.FollowerId, f.FollowingId });

        modelBuilder.Entity<UserFollow>()
            .HasOne(f => f.Follower)
            .WithMany(u => u.Following)
            .HasForeignKey(f => f.FollowerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<UserFollow>()
            .HasOne(f => f.Following)
            .WithMany(u => u.Followers)
            .HasForeignKey(f => f.FollowingId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
