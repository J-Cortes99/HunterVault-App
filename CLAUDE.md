# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two top-level projects in one repo, deployed independently:

- `HunterVault.Api/` — ASP.NET Core (`net10.0`) Web API, EF Core + SQL Server, JWT auth, SignalR. Solution file: `HunterVault.slnx`.
- `HunterVault.Frontend/` — Vite + React 19 + TypeScript SPA, Tailwind v4, TanStack Query, deployed to Vercel (see `vercel.json`).

## Commands

API (`HunterVault.Api/`):
- Run dev server: `dotnet run` — listens on `http://localhost:5147` (HTTPS profile also on `https://localhost:7004`). Migrations run automatically on startup via `app.MigrateDb()`.
- Add migration: `dotnet ef migrations add <Name>`
- Apply manually: `dotnet ef database update`
- OpenAPI/Scalar docs (dev only): `http://localhost:5147/scalar`

Frontend (`HunterVault.Frontend/`):
- Dev: `npm run dev` (port 5173, proxies `/api` → `http://localhost:5147` per `vite.config.ts`)
- Build: `npm run build` (runs `tsc -b` then `vite build` — type errors fail the build)
- Lint: `npm run lint`

There is no test suite in either project.

## Required configuration

API needs these set via `dotnet user-secrets` (UserSecretsId `75a78199-...` is in the csproj) or env vars — `appsettings.json` only has placeholders:
- `ConnectionStrings:HunterVault` — SQL Server connection string
- `AppSettings:Token` — JWT signing key (HMAC-SHA512, must be long enough)
- `IgdbApi:ClientId` / `IgdbApi:ClientSecret` — Twitch/IGDB OAuth credentials
- `Smtp:Email` / `Smtp:Password` — Gmail SMTP for email verification (host/port default to Gmail in `appsettings.json`)

Frontend uses `VITE_API_URL` (defaults to `http://localhost:5147/api`). The SignalR hub URL is derived by stripping `/api` from this value.

## Architecture

### API request pipeline (`Program.cs`)
- **CORS**: dev policy allows `http://localhost:5173`; prod uses `AllowVercel` policy for `https://huntervault.vercel.app`. The pipeline picks one based on `IsDevelopment()`.
- **Rate limiting** is partitioned per remote IP, with named policies applied per route group: `"fixed"` (100/min, default for games + profile), `"auth"` (3 per 10 min, on `AuthController`), `"search"` (20/min, on IGDB + username availability), `"concurrency"` (10 simultaneous). Add `.RequireRateLimiting("...")` on new endpoint groups.
- **JWT auth** uses claim types `ClaimTypes.Name` (username) and `ClaimTypes.NameIdentifier` (user Guid). The `OnMessageReceived` event reads `?access_token=` from the query string when the path starts with `/hubs` — required because browser `WebSocket` cannot send custom headers.
- Endpoints are split between `Controller/AuthController.cs` (MVC controller) and `Endpoints/*.cs` (minimal-API extension methods registered in `Program.cs`). New game/profile/IGDB routes go in the minimal-API style; auth stays in the controller.

### Domain model
- `User` (Guid id) → many `Game`s (int id, scoped per user — every games endpoint filters by `UserId`).
- `UserFollow` is a join entity with composite key `(FollowerId, FollowingId)` and `DeleteBehavior.Restrict` on both FKs (configured in `HunterVaultContext.OnModelCreating`). Both navigation collections (`User.Followers`, `User.Following`) point to it.
- `GameStatus` enum order is load-bearing: `Backlog=0, Playing=1, Completed=2, Platinumed=3, Dropped=4`. The frontend `App.tsx` switches on the integer value to render activity toasts, and trophy-percentage logic in `GamesEndpoints` forces `100` for `Platinumed` and `null` for `Backlog`/`Dropped` — preserve this when changing the enum or the create/update flows.
- XP/level is a derived value, not stored. `ProfileEndpoints.CalculateLevel`/`GetXpStats` use the formula `level = max(1, sqrt(totalXp / 100))` where `gameXp = trophy% * 10 + (500 if Completed) + (2000 if Platinumed), then * (1 + difficulty * 0.1)`. The frontend duplicates this in `src/utils/xp.ts` — keep them in sync.

### Real-time (SignalR)
- Single hub `SocialHub` mounted at `/hubs/social`.
- `UserIdProvider` maps SignalR's user identifier to the JWT `NameIdentifier` (Guid string), so `Clients.Users(userIds)` works with user Guids as strings.
- When a game is created/updated, `GamesEndpoints` queries `UserFollows` for the actor's followers and sends `ReceiveActivityUpdate(username, gameName, statusInt, trophyPct?)` only to those follower IDs — broadcasts are scoped, not global.
- The frontend connects in `App.tsx` and invalidates the `['activity-feed']` query on every event; toasts are suppressed for the current user's own actions.

### IGDB integration (`Services/IgdbService.cs`)
- Registered as `AddHttpClient<IIgdbService, IgdbService>()`, so it's effectively scoped per-request but the underlying `HttpMessageHandler` is pooled.
- The Twitch OAuth token and its expiry are stored in instance fields and refreshed via a `SemaphoreSlim` double-checked lock in `EnsureAccessTokenAsync`. Because the service is scoped, the token is *not* shared across requests — if you change the lifetime to singleton, the lock matters more.
- Search results are cached in `IMemoryCache` for 15 min; full game details for 24h. Cover URLs come back as `//images.igdb.com/...t_thumb...` and are rewritten to `https://...t_cover_big` (or `t_1080p` for details/screenshots) by `ProcessCoverUrl`.
- IGDB game `category` is filtered to `[0, 8, 9, 10, 11]` (main game + remake/remaster/expanded/port) before deduping by name.

### Frontend
- `App.tsx` wraps everything in `BrowserRouter` → `QueryClientProvider` → `AuthProvider`. Routes are gated on `isAuthenticated` from `useAuth()`; unauthenticated users see `<AuthPage />` for everything except `/profile/:username` (public).
- `AuthContext` stores `accessToken`, `refreshToken`, `userId` in `localStorage`. It installs axios interceptors on `apiClient` that (a) attach `Authorization: Bearer ...` and (b) on 401 attempt one refresh via `/auth/refresh`, retry the original request, then clear tokens on failure. New API modules should import the shared `apiClient` from `src/api/client.ts` so they get this behavior.
- TanStack Query default `staleTime: 30_000`, `retry: 1`. Mutations should `invalidateQueries({ queryKey: ['activity-feed'] })` when they change game state — SignalR also triggers this invalidation.

### Migrations
EF Core migrations live in `HunterVault.Api/Migrations/` and run on startup. Don't hand-edit applied migrations; create a new one. The `HunterVaultContextModelSnapshot` is regenerated automatically.
