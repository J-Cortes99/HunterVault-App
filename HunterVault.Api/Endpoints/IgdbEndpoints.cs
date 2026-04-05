using HunterVault.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HunterVault.Api.Endpoints;

public static class IgdbEndpoints
{
    public static void MapIgdbEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/igdb").RequireAuthorization();

        group.MapGet("/search", async ([FromQuery] string q, IIgdbService igdbService) =>
        {
            if (string.IsNullOrWhiteSpace(q)) 
                return Results.Ok(new List<object>());
                
            var results = await igdbService.SearchGamesAsync(q);
            
            var mapped = results.Select(r => new {
                id = r.Id,
                name = r.Name,
                coverUrl = r.Cover?.Url
            });
            
            return Results.Ok(mapped);
        });

        group.MapGet("/details/id/{id:int}", async (int id, IIgdbService igdbService) =>
        {
            var details = await igdbService.GetFullGameDetailsByIdAsync(id);
            if (details == null)
                return Results.NotFound($"No details found for IGDB ID {id}");

            return Results.Ok(details);
        });
    }
}
