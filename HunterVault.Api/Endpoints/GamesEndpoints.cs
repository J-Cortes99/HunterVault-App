using HunterVault.Api.Configuration;
using HunterVault.Application.Abstractions.Games;
using HunterVault.Application.Abstractions.Identity;
using HunterVault.Application.Dtos.Games;

namespace HunterVault.Api.Endpoints;

public static class GamesEndpoints
{
    private const string GetGameRouteName = "GetGame";

    public static void MapGamesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/games")
            .RequireAuthorization()
            .RequireRateLimiting(RateLimitingConfiguration.Fixed);

        group.MapGet("/", async (IUserContext ctx, IGameService games, CancellationToken ct) =>
        {
            if (ctx.UserId is not Guid uid) return Results.Unauthorized();
            return Results.Ok(await games.GetAllForUserAsync(uid, ct));
        });

        group.MapGet("/{id:int}", async (int id, IUserContext ctx, IGameService games, CancellationToken ct) =>
        {
            if (ctx.UserId is not Guid uid) return Results.Unauthorized();
            var game = await games.GetByIdAsync(id, uid, ct);
            return game is null ? Results.NotFound() : Results.Ok(game);
        }).WithName(GetGameRouteName);

        group.MapPost("/", async (CreateGameDto input, IUserContext ctx, IGameService games, CancellationToken ct) =>
        {
            if (ctx.UserId is not Guid uid) return Results.Unauthorized();
            var actor = ctx.Username ?? "Un cazador";
            var created = await games.CreateAsync(input, uid, actor, ct);
            return Results.CreatedAtRoute(GetGameRouteName, new { id = created.Id }, created);
        });

        group.MapPut("/{id:int}", async (int id, UpdateGameDto input, IUserContext ctx, IGameService games, CancellationToken ct) =>
        {
            if (ctx.UserId is not Guid uid) return Results.Unauthorized();
            var actor = ctx.Username ?? "Un cazador";
            var updated = await games.UpdateAsync(id, input, uid, actor, ct);
            return updated ? Results.NoContent() : Results.NotFound();
        });

        group.MapDelete("/{id:int}", async (int id, IUserContext ctx, IGameService games, CancellationToken ct) =>
        {
            if (ctx.UserId is not Guid uid) return Results.Unauthorized();
            await games.DeleteAsync(id, uid, ct);
            return Results.NoContent();
        });
    }
}
