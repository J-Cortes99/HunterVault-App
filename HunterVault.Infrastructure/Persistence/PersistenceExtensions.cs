using HunterVault.Application.Abstractions.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HunterVault.Infrastructure.Persistence;

public static class PersistenceExtensions
{
    public static IServiceCollection AddHunterVaultPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var connString = configuration.GetConnectionString("HunterVault");
        services.AddDbContext<HunterVaultContext>(options => options.UseNpgsql(connString));
        services.AddScoped<IHunterVaultDbContext>(sp => sp.GetRequiredService<HunterVaultContext>());
        return services;
    }

    public static void MigrateDb(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HunterVaultContext>();
        dbContext.Database.Migrate();
    }
}
