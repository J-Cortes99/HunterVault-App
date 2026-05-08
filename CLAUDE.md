# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

The backend follows Clean Architecture with four sibling projects (dependency rule `Api → Infrastructure → Application → Domain`); the frontend is a separate SPA. Solution file: `HunterVault.slnx`.

- `HunterVault.Domain/` — Class library, no external deps. Entities (`User`, `Game`, `UserFollow`), enums (`GameStatus`), pure rules (`GameRules`, `XpCalculator`).
- `HunterVault.Application/` — Use cases + ports. References Domain only.
  - `Abstractions/` — interfaces grouped by area: infra ports (`Persistence/IHunterVaultDbContext`, `Identity/IPasswordHasher`, `Identity/IJwtTokenGenerator`, `Identity/IUserContext`, `Messaging/IEmailSender`, `Messaging/IActivityNotifier`, `External/IIgdbService`, `Time/IClock`, `Time/IVerificationCodeGenerator`) **and** service interfaces (`Auth/`, `Games/`, `Profile/`).
  - `Services/` — implementations of the service interfaces. **Result enums and records (`FollowResult`, `UnfollowResult`, `RegistrationResult`) live with their interface in `Abstractions/`, not here.**
  - `Dtos/` — request/response contracts grouped by area (`Auth/`, `Games/`, `Igdb/`, `Profile/`).
  - `Configuration/` — `JwtOptions`, `IgdbOptions`, `SmtpOptions`.
  - `DependencyInjection.AddApplicationServices()` registers all services as `Scoped`.
- `HunterVault.Infrastructure/` — Concrete implementations. References Application + Domain. Uses `<FrameworkReference Include="Microsoft.AspNetCore.App" />` so it can use `PasswordHasher<T>`, `Hub`, `IHubContext` without extra packages.
  - `Persistence/HunterVaultContext` (implements `IHunterVaultDbContext`), `Persistence/Migrations/`, `Persistence/PersistenceExtensions` (DI + `MigrateDb`).
  - `Identity/` — `AspNetIdentityPasswordHasher`, `JwtTokenGenerator`.
  - `External/IgdbService` (+ `IgdbResponses.cs` with `internal` JSON DTOs).
  - `Messaging/` — `SmtpEmailSender`, `SocialHub`, `SignalRActivityNotifier`.
  - `Common/` — `SystemClock`, `RandomVerificationCodeGenerator`.
  - `DependencyInjection.AddInfrastructure(IConfiguration)` binds Options + registers all adapters + `AddDbContext` + `AddHttpClient<IIgdbService, IgdbService>`.
- `HunterVault.Api/` — Composition root only. References Application + Infrastructure. No domain logic.
  - `Program.cs` — wiring + middleware. Calls `AddInfrastructure` then `AddApplicationServices`.
  - `Configuration/` — `CorsConfiguration`, `RateLimitingConfiguration` (string constants for policy names), `AuthenticationConfiguration` (JWT bearer + SignalR query-string token hook).
  - `Endpoints/` — minimal-API extension methods: `AuthEndpoints`, `GamesEndpoints`, `ProfileEndpoints`, `IgdbEndpoints`. Each is a thin adapter that pulls `userId` via `IUserContext` and calls a service.
  - `Identity/HttpUserContext` — implements `IUserContext` reading claims via `IHttpContextAccessor`.
  - `Providers/UserIdProvider` — SignalR `IUserIdProvider` (kept here because it's an ASP.NET concern).
- `HunterVault.Frontend/` — Vite + React 19 + TypeScript SPA, Tailwind v4, TanStack Query, deployed to Vercel (see `vercel.json`).

## Commands

Backend (run from repo root or `HunterVault.Api/`):
- Run dev server: `cd HunterVault.Api && dotnet run` — listens on `http://localhost:5147` (HTTPS profile also on `https://localhost:7004`). Migrations run automatically on startup via `app.Services.MigrateDb()`.
- Build solution: `dotnet build HunterVault.slnx`
- Add migration: `dotnet ef migrations add <Name> --project HunterVault.Infrastructure --startup-project HunterVault.Api` (both flags required because the DbContext lives in Infrastructure but the composition root is in Api).
- List migrations: `dotnet ef migrations list --project HunterVault.Infrastructure --startup-project HunterVault.Api`
- Apply manually: `dotnet ef database update --project HunterVault.Infrastructure --startup-project HunterVault.Api`
- OpenAPI/Scalar docs (dev only): `http://localhost:5147/scalar`

Frontend (`HunterVault.Frontend/`):
- Dev: `npm run dev` (port 5173, proxies `/api` → `http://localhost:5147` per `vite.config.ts`)
- Build: `npm run build` (runs `tsc -b` then `vite build` — type errors fail the build)
- Lint: `npm run lint`

There is no test suite in either project.

## Required configuration

API needs these set via `dotnet user-secrets` (UserSecretsId `75a78199-...` is in `HunterVault.Api.csproj`) or env vars — `appsettings.json` only has placeholders. Bound to strongly-typed `Options` classes in `HunterVault.Application.Configuration` via `IOptions<T>`:
- `ConnectionStrings:HunterVault` — SQL Server connection string
- `AppSettings:Token` / `AppSettings:Issuer` / `AppSettings:Audience` — JWT (`Token` is the HMAC-SHA512 signing key, must be long enough). Bound to `JwtOptions`.
- `IgdbApi:ClientId` / `IgdbApi:ClientSecret` — Twitch/IGDB OAuth credentials. Bound to `IgdbOptions`.
- `Smtp:Email` / `Smtp:Password` — Gmail SMTP for email verification (host/port default to Gmail in `appsettings.json`). Bound to `SmtpOptions`.

Frontend uses `VITE_API_URL` (defaults to `http://localhost:5147/api`). The SignalR hub URL is derived by stripping `/api` from this value.

## Architecture

### Where things go (when adding a feature)
- **Pure business rule** (no IO): `HunterVault.Domain/Rules/`. Reusable from any layer. Example: `XpCalculator`, `GameRules.NormalizeTrophyPercentage`.
- **New use case**: define interface in `HunterVault.Application/Abstractions/<Area>/IFooService.cs`, implementation in `HunterVault.Application/Services/<Area>/FooService.cs`, register in `Application/DependencyInjection.cs`. Inject ports (e.g. `IHunterVaultDbContext`, `IClock`) — never reach for `HunterVaultContext` or `DateTime.UtcNow` directly from a service.
- **New infrastructure adapter** (e.g. an external API, a different password hasher, push notifications): define the port in `Application/Abstractions/<Area>/`, implement in `Infrastructure/<Area>/`, register in `Infrastructure/DependencyInjection.cs`.
- **New HTTP route**: add an endpoint to the relevant `HunterVault.Api/Endpoints/*Endpoints.cs` file. Keep it thin: pull `userId` from `IUserContext`, call a service, map to `Results.*`. No business logic, no EF, no `ClaimsPrincipal` parsing.
- **New configuration value**: add a property to the relevant `Options` class (`JwtOptions`/`IgdbOptions`/`SmtpOptions`) in `Application/Configuration/`. Binding happens in `Infrastructure.DependencyInjection.AddInfrastructure`.

### API request pipeline (`Program.cs`)
- Order: `AddHunterVaultCors` → `AddHunterVaultRateLimiting` → `AddHunterVaultJwtAuth` → SignalR + `IUserIdProvider` → `IHttpContextAccessor` + `IUserContext` → `AddInfrastructure` → `AddApplicationServices`. Then build, then `UseCors` → `UseRateLimiter` → `UseAuthentication` → `UseAuthorization` → map endpoints + hub → `MigrateDb()` → `Run()`.
- **CORS**: dev policy allows `http://localhost:5173`; prod uses `AllowVercel` policy for `https://huntervault.vercel.app`. Pipeline picks one based on `IsDevelopment()`. Names are constants on `CorsConfiguration`.
- **Rate limiting** is partitioned per remote IP, with named policies (constants on `RateLimitingConfiguration`): `Fixed` (100/min, default for games + profile), `Auth` (3 per 10 min, on `AuthEndpoints`), `Search` (20/min, on IGDB + username availability), `Concurrency` (10 simultaneous, currently unused). Add `.RequireRateLimiting(RateLimitingConfiguration.Fixed)` on new endpoint groups — don't pass raw strings.
- **JWT auth** uses claim types `ClaimTypes.Name` (username) and `ClaimTypes.NameIdentifier` (user Guid). The `OnMessageReceived` event in `AuthenticationConfiguration` reads `?access_token=` from the query string when the path starts with `/hubs` — required because browser `WebSocket` cannot send custom headers.
- All endpoints are minimal-API extension methods registered in `Program.cs`. There are no MVC controllers.

### Reading the user from a request
- In endpoints / services, **never** parse `ClaimsPrincipal` directly. Inject `IUserContext` and use `ctx.UserId` (nullable `Guid?`) and `ctx.Username`. Endpoints check `if (ctx.UserId is not Guid uid) return Results.Unauthorized();`.
- The implementation `HttpUserContext` lives in `HunterVault.Api/Identity/` and reads from `IHttpContextAccessor`. This means `IUserContext` is mockable in unit tests without HTTP.

### Domain model
- `User` (Guid id) → many `Game`s (int id, scoped per user — every games service filters by `UserId`).
- `UserFollow` is a join entity with composite key `(FollowerId, FollowingId)` and `DeleteBehavior.Restrict` on both FKs (configured in `HunterVaultContext.OnModelCreating`). Both navigation collections (`User.Followers`, `User.Following`) point to it.
- `GameStatus` enum order is load-bearing: `Backlog=0, Playing=1, Completed=2, Platinumed=3, Dropped=4`. The frontend `App.tsx` switches on the integer value to render activity toasts. Trophy-percentage normalization is centralized in `Domain/Rules/GameRules.NormalizeTrophyPercentage(status, raw)` (forces `100` for `Platinumed`, `null` for `Backlog`/`Dropped`) — `GameService` uses this in both create and update; never inline the rule.
- XP/level is a derived value, not stored. `Domain/Rules/XpCalculator.CalculateLevel(games)` and `CalculateStats(games)` are the single source of truth, used by `ProfileService`. Formula: `level = max(1, sqrt(totalXp / 100))` where `gameXp = trophy% * 10 + (500 if Completed) + (2000 if Platinumed), then * (1 + difficulty * 0.1)`. The frontend duplicates this in `src/utils/xp.ts` — keep them in sync.

### Real-time (SignalR)
- Single hub `SocialHub` (in `HunterVault.Infrastructure/Messaging/`) mounted at `/hubs/social` from `Program.cs`.
- `UserIdProvider` (in `HunterVault.Api/Providers/`) maps SignalR's user identifier to the JWT `NameIdentifier` (Guid string), so `Clients.Users(userIds)` works with user Guids as strings.
- When a game is created/updated, `GameService.NotifyFollowersAsync` queries `IHunterVaultDbContext.UserFollows` for the actor's followers and calls `IActivityNotifier.NotifyUsersAsync(...)`. The concrete `SignalRActivityNotifier` (in Infrastructure) wraps `IHubContext<SocialHub>` and emits `ReceiveActivityUpdate(username, gameName, statusInt, trophyPct?)` to those follower IDs only — broadcasts are scoped, not global.
- The frontend connects in `App.tsx` and invalidates the `['activity-feed']` query on every event; toasts are suppressed for the current user's own actions.

### IGDB integration (`Infrastructure/External/IgdbService.cs`)
- Registered as `AddHttpClient<IIgdbService, IgdbService>()` from `Infrastructure.DependencyInjection`, so it's effectively scoped per-request but the underlying `HttpMessageHandler` is pooled.
- Reads credentials from `IOptions<IgdbOptions>` (no direct `IConfiguration`).
- The Twitch OAuth token and its expiry are stored in instance fields and refreshed via a `SemaphoreSlim` double-checked lock in `EnsureAccessTokenAsync`. Because the service is scoped, the token is *not* shared across requests — if you change the lifetime to singleton, the lock matters more.
- Search results are cached in `IMemoryCache` for 15 min; full game details for 24h. Cover URLs come back as `//images.igdb.com/...t_thumb...` and are rewritten to `https://...t_cover_big` (or `t_1080p` for details/screenshots) by `ProcessCoverUrl`.
- IGDB game `category` is filtered to `[0, 8, 9, 10, 11]` (main game + remake/remaster/expanded/port) before deduping by name.
- Internal JSON response classes (`IgdbGameResponse`, `TwitchAuthResponse`, etc.) are `internal` to Infrastructure — they don't leak through the `IIgdbService` contract. The interface returns Application DTOs (`IgdbSearchResultDto`, `IgdbGameDetailsDto`).

### Frontend
- `App.tsx` wraps everything in `BrowserRouter` → `QueryClientProvider` → `AuthProvider`. Routes are gated on `isAuthenticated` from `useAuth()`; unauthenticated users see `<AuthPage />` for everything except `/profile/:username` (public).
- `AuthContext` stores `accessToken`, `refreshToken`, `userId` in `localStorage`. It installs axios interceptors on `apiClient` that (a) attach `Authorization: Bearer ...` and (b) on 401 attempt one refresh via `/auth/refresh`, retry the original request, then clear tokens on failure. New API modules should import the shared `apiClient` from `src/api/client.ts` so they get this behavior.
- TanStack Query default `staleTime: 30_000`, `retry: 1`. Mutations should `invalidateQueries({ queryKey: ['activity-feed'] })` when they change game state — SignalR also triggers this invalidation.

### Migrations
EF Core migrations live in `HunterVault.Infrastructure/Persistence/Migrations/` and run on startup via `app.Services.MigrateDb()`. Don't hand-edit applied migrations; create a new one with the command above. The `HunterVaultContextModelSnapshot` is regenerated automatically by EF tooling.
