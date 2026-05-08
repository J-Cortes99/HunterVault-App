namespace HunterVault.Api.Configuration;

public static class CorsConfiguration
{
    public const string VercelPolicy = "AllowVercel";

    public static IServiceCollection AddHunterVaultCors(this IServiceCollection services) =>
        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            });
            options.AddPolicy(VercelPolicy, policy =>
            {
                policy.WithOrigins("https://huntervault.vercel.app")
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            });
        });
}
