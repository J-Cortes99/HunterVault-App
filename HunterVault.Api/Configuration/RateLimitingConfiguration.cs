using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

namespace HunterVault.Api.Configuration;

public static class RateLimitingConfiguration
{
    public const string Fixed = "fixed";
    public const string Auth = "auth";
    public const string Search = "search";
    public const string Concurrency = "concurrency";

    public static IServiceCollection AddHunterVaultRateLimiting(this IServiceCollection services) =>
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddPolicy(Fixed, ctx =>
                RateLimitPartition.GetFixedWindowLimiter(
                    PartitionKey(ctx),
                    _ => new FixedWindowRateLimiterOptions { PermitLimit = 100, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));

            options.AddPolicy(Auth, ctx =>
                RateLimitPartition.GetFixedWindowLimiter(
                    PartitionKey(ctx),
                    _ => new FixedWindowRateLimiterOptions { PermitLimit = 3, Window = TimeSpan.FromMinutes(10), QueueLimit = 0 }));

            options.AddPolicy(Search, ctx =>
                RateLimitPartition.GetFixedWindowLimiter(
                    PartitionKey(ctx),
                    _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));

            options.AddPolicy(Concurrency, ctx =>
                RateLimitPartition.GetConcurrencyLimiter(
                    PartitionKey(ctx),
                    _ => new ConcurrencyLimiterOptions { PermitLimit = 10, QueueLimit = 0 }));
        });

    private static string PartitionKey(HttpContext ctx) =>
        ctx.Connection.RemoteIpAddress?.ToString() ?? ctx.Request.Headers.Host.ToString();
}
