using HunterVault.Application.Abstractions.External;
using HunterVault.Application.Abstractions.Identity;
using HunterVault.Application.Abstractions.Messaging;
using HunterVault.Application.Abstractions.Time;
using HunterVault.Application.Configuration;
using HunterVault.Infrastructure.Common;
using HunterVault.Infrastructure.External;
using HunterVault.Infrastructure.Identity;
using HunterVault.Infrastructure.Messaging;
using HunterVault.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HunterVault.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<IgdbOptions>(configuration.GetSection(IgdbOptions.SectionName));
        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SectionName));

        services.AddHunterVaultPersistence(configuration);

        services.AddMemoryCache();

        services.AddSingleton<IClock, SystemClock>();
        services.AddSingleton<IVerificationCodeGenerator, RandomVerificationCodeGenerator>();

        services.AddScoped<IPasswordHasher, AspNetIdentityPasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddScoped<IActivityNotifier, SignalRActivityNotifier>();

        services.AddHttpClient<IIgdbService, IgdbService>();

        return services;
    }
}
