using GameStore.Api.Data;
using GameStore.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddValidation();

builder.AddGameStoreDb();

var app = builder.Build();

app.UseCors();

app.MapGamesEndpoints();
app. MapGenresEndpoints();

app.MigrateDb();

app.Run();
