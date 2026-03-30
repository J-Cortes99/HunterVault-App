using GameStore.Api.Data;
using GameStore.Api.Endpoints;
using Scalar.AspNetCore;

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

builder.Services.AddControllers();

builder.AddGameStoreDb();

builder.Services.AddOpenApi();

var app = builder.Build();

app.UseCors();

if(app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapControllers();
app.MapGamesEndpoints();
app.MapGenresEndpoints();

app.MigrateDb();

app.Run();
