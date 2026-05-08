using HunterVault.Application.Abstractions.Auth;
using HunterVault.Application.Abstractions.Games;
using HunterVault.Application.Abstractions.Profile;
using HunterVault.Application.Services.Auth;
using HunterVault.Application.Services.Games;
using HunterVault.Application.Services.Profile;
using Microsoft.Extensions.DependencyInjection;

namespace HunterVault.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IGameService, GameService>();

        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IFollowService, FollowService>();
        services.AddScoped<IFeedService, FeedService>();

        services.AddScoped<IAuthenticationService, AuthenticationService>();
        services.AddScoped<IRegistrationService, RegistrationService>();
        services.AddScoped<IEmailVerificationService, EmailVerificationService>();
        services.AddScoped<IPasswordResetService, PasswordResetService>();

        return services;
    }
}
