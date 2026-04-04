
using HunterVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HunterVault.Api.Data;

public static class DataExtensions
{
    public static void MigrateDb(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HunterVaultContext>();
        dbContext.Database.Migrate();
    }

    public static void AddHunterVaultDb(this WebApplicationBuilder builder)
    {
        var connString = builder.Configuration.GetConnectionString("HunterVault");
        builder.Services.AddSqlServer<HunterVaultContext>(connString);
    }
}
