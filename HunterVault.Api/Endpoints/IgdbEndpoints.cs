using HunterVault.Api.Configuration;
using HunterVault.Application.Abstractions.External;
using Microsoft.AspNetCore.Mvc;

namespace HunterVault.Api.Endpoints;

public static class IgdbEndpoints
{
    public static void MapIgdbEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/igdb")
            .RequireAuthorization()
            .RequireRateLimiting(RateLimitingConfiguration.Search);

        group.MapGet("/search", async ([FromQuery] string q, IIgdbService igdb, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(q))
                return Results.Ok(Array.Empty<object>());

            var results = await igdb.SearchGamesAsync(q, ct);
            var mapped = results.Select(r => new { id = r.Id, name = r.Name, coverUrl = r.CoverUrl });
            return Results.Ok(mapped);
        });

        group.MapGet("/details/id/{id:int}", async (int id, IIgdbService igdb, CancellationToken ct) =>
        {
            var details = await igdb.GetFullGameDetailsByIdAsync(id, ct);
            return details is null
                ? Results.NotFound($"No details found for IGDB ID {id}")
                : Results.Ok(details);
        });
    }
}
