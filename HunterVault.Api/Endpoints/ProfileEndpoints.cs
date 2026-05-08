using HunterVault.Api.Configuration;
using HunterVault.Application.Abstractions.Identity;
using HunterVault.Application.Abstractions.Profile;
using HunterVault.Application.Dtos.Profile;

namespace HunterVault.Api.Endpoints;

public static class ProfileEndpoints
{
    public static void MapProfileEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/profile").RequireRateLimiting(RateLimitingConfiguration.Fixed);

        group.MapGet("/{username}", async (string username, IProfileService profiles, CancellationToken ct) =>
        {
            var profile = await profiles.GetPublicProfileAsync(username, ct);
            return profile is null
                ? Results.NotFound(new { message = "User not found." })
                : Results.Ok(profile);
        });

        group.MapPut("/", async (UpdateProfileDto dto, IUserContext ctx, IProfileService profiles, CancellationToken ct) =>
        {
            if (ctx.UserId is not Guid uid) return Results.Unauthorized();
            var ok = await profiles.UpdateProfileAsync(uid, dto, ct);
            return ok
                ? Results.Ok(new { message = "Profile updated successfully." })
                : Results.NotFound(new { message = "User not found." });
        }).RequireAuthorization();

        group.MapGet("/search", async (string query, IUserContext ctx, IProfileService profiles, CancellationToken ct) =>
        {
            if (ctx.UserId is not Guid uid) return Results.Unauthorized();
            return Results.Ok(await profiles.SearchUsersAsync(query, uid, ct));
        }).RequireAuthorization();

        group.MapPost("/follow/{targetUserId:guid}", async (Guid targetUserId, IUserContext ctx, IFollowService follows, CancellationToken ct) =>
        {
            if (ctx.UserId is not Guid uid) return Results.Unauthorized();
            var result = await follows.FollowAsync(uid, targetUserId, ct);
            return result switch
            {
                FollowResult.Followed => Results.Ok(new { message = "Followed successfully." }),
                FollowResult.AlreadyFollowing => Results.Ok(new { message = "Already following." }),
                FollowResult.CannotFollowSelf => Results.BadRequest("You cannot follow yourself."),
                _ => Results.StatusCode(500)
            };
        }).RequireAuthorization();

        group.MapDelete("/follow/{targetUserId:guid}", async (Guid targetUserId, IUserContext ctx, IFollowService follows, CancellationToken ct) =>
        {
            if (ctx.UserId is not Guid uid) return Results.Unauthorized();
            var result = await follows.UnfollowAsync(uid, targetUserId, ct);
            return result == UnfollowResult.Unfollowed
                ? Results.Ok(new { message = "Unfollowed successfully." })
                : Results.NotFound();
        }).RequireAuthorization();

        group.MapGet("/feed", async (IUserContext ctx, IFeedService feed, CancellationToken ct, int page = 1, int pageSize = 10) =>
        {
            if (ctx.UserId is not Guid uid) return Results.Unauthorized();
            return Results.Ok(await feed.GetFeedAsync(uid, page, pageSize, ct));
        }).RequireAuthorization();

        group.MapGet("/recommended", async (IUserContext ctx, IProfileService profiles, CancellationToken ct) =>
        {
            if (ctx.UserId is not Guid uid) return Results.Unauthorized();
            return Results.Ok(await profiles.GetRecommendedAsync(uid, ct));
        }).RequireAuthorization();
    }
}
