
using HunterVault.Api.Entities;
using HunterVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Api.Data;

public class HunterVaultContext(DbContextOptions<HunterVaultContext> options) 
    : DbContext(options)
{
    public DbSet<Game> Games => Set<Game>();
    public DbSet<User> Users => Set<User>();
}
