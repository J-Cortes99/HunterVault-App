using HunterVault.Api.Configuration;
using HunterVault.Api.Endpoints;
using HunterVault.Api.Identity;
using HunterVault.Api.Providers;
using HunterVault.Application;
using HunterVault.Application.Abstractions.Identity;
using HunterVault.Infrastructure;
using HunterVault.Infrastructure.Messaging;
using HunterVault.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHunterVaultCors();
builder.Services.AddHunterVaultRateLimiting();
builder.Services.AddHunterVaultJwtAuth(builder.Configuration);

builder.Services.AddSignalR();
builder.Services.AddSingleton<IUserIdProvider, UserIdProvider>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserContext, HttpUserContext>();

builder.Services.AddValidation();
builder.Services.AddOpenApi();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplicationServices();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors();
    app.MapOpenApi();
    app.MapScalarApiReference();
}
else
{
    app.UseCors(CorsConfiguration.VercelPolicy);
}

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapGamesEndpoints();
app.MapProfileEndpoints();
app.MapIgdbEndpoints();

app.MapHub<SocialHub>("/hubs/social");

app.Services.MigrateDb();

app.Run();
