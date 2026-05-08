<h1 align="center" style="font-weight: bold;">HunterVault 🏆</h1>

<p align="center">
  <a href="#tecnologias">Tecnologías</a> •
  <a href="#arquitectura">Arquitectura</a> •
  <a href="#instalacion">Instalación</a> •
  <a href="#endpoints">API Endpoints</a> •
  <a href="#contribuir">Contribuir</a>
</p>

<p align="center"><b>HunterVault</b> es una plataforma full-stack diseñada para gamers. Permite gestionar bibliotecas de juegos, seguir el progreso del "backlog", registrar trofeos y conectar con otros jugadores en tiempo real. Utiliza la API de IGDB para obtener datos precisos de miles de videojuegos.</p>

<p align="center">
  <a href="https://huntervault.vercel.app">📱 Visitar el Proyecto (Demo en vivo)</a>
</p>

<h2 id="tecnologias">💻 Tecnologías</h2>

El proyecto utiliza una arquitectura desacoplada moderna, con el backend robusto en Azure y un frontend ágil en Vercel.

**Frontend:**
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) (Estilos)
- [TanStack Query](https://tanstack.com/query) (Cache de servidor)
- [Axios](https://axios-http.com/) (Cliente HTTP)

**Backend:**
- [ASP.NET Core 10](https://dotnet.microsoft.com/) (Web API, Minimal APIs)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/) (ORM Code-first)
- [SignalR](https://dotnet.microsoft.com/apps/aspnet/signalr) (Funciones sociales en tiempo real)
- [IGDB API](https://api-docs.igdb.com/) (Proveedor de datos de videojuegos)
- JWT Bearer + ASP.NET Identity password hashing
- Gmail SMTP para verificación de email y reset de contraseña

**Infraestructura:**
- **Azure App Service:** Hosting del Backend.
- **Azure SQL Database:** Base de datos relacional.
- **Vercel:** Hosting del Frontend.
- **GitHub Actions:** Pipelines de CI/CD automáticos.

<h2 id="arquitectura">🏛 Arquitectura</h2>

El backend sigue **Clean Architecture** con cuatro proyectos y la regla de dependencias `API → Infrastructure → Application → Domain`:

```
HunterVault.Domain/         Entidades, enums y reglas de negocio puras
                            (XpCalculator, GameRules.NormalizeTrophyPercentage).
                            Sin dependencias externas.

HunterVault.Application/    Casos de uso y contratos.
  ├── Abstractions/         Puertos (IHunterVaultDbContext, IUserContext,
  │                         IPasswordHasher, IJwtTokenGenerator, IEmailSender,
  │                         IActivityNotifier, IIgdbService, IClock...) e
  │                         interfaces de servicios (IGameService, IProfileService,
  │                         IAuthenticationService, IRegistrationService...).
  ├── Services/             Implementaciones de los servicios de aplicación.
  ├── Dtos/                 Contratos de entrada/salida agrupados por área.
  └── Configuration/        JwtOptions, IgdbOptions, SmtpOptions.

HunterVault.Infrastructure/ Implementaciones de los puertos.
  ├── Persistence/          HunterVaultContext + migraciones EF Core.
  ├── Identity/             AspNetIdentityPasswordHasher, JwtTokenGenerator.
  ├── External/             IgdbService (HttpClient + cache + Twitch OAuth).
  ├── Messaging/            SmtpEmailSender, SocialHub, SignalRActivityNotifier.
  └── Common/               SystemClock, RandomVerificationCodeGenerator.

HunterVault.Api/            Composition root.
  ├── Program.cs            Wiring + middleware.
  ├── Configuration/        CORS, RateLimiting, JWT auth.
  ├── Endpoints/            Adaptadores HTTP delgados (Auth, Games, Profile, Igdb).
  ├── Identity/             HttpUserContext (extrae claims del HttpContext).
  └── Providers/            UserIdProvider para SignalR.
```

Los endpoints son adaptadores HTTP delgados: validan, extraen el `userId` del contexto y delegan en los servicios de Application. Toda la lógica de dominio (reglas de XP, normalización de trofeos) vive en `Domain` y se reutiliza en cualquier capa.

<h2 id="instalacion">🚀 Instalación</h2>

Sigue estos pasos para ejecutar el proyecto en tu entorno local de desarrollo.

<h3>Prerrequisitos</h3>

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js (v18 o superior)](https://nodejs.org/)
- [Git](https://git-scm.com/)
- Una cuenta de [Twitch Developer](https://dev.twitch.tv/) para obtener las llaves de la API de IGDB.

<h3>Clonación</h3>

```bash
git clone https://github.com/j-cortes99/huntervault-app.git
```

<h3>Configuración del Backend (ASP.NET Core)</h3>

1. Navega a la carpeta de la API (proyecto de arranque, composition root):

```bash
cd huntervault-app/HunterVault.Api
```

2. Configura los secretos vía `dotnet user-secrets` (recomendado) o editando `appsettings.Development.json`. Las claves esperadas son:

```jsonc
{
  "ConnectionStrings": {
    "HunterVault": "Server=localhost;Database=HunterVault;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "AppSettings": {
    "Token": "UNA_CLAVE_HMAC_SHA512_LARGA_AL_MENOS_64_BYTES",
    "Issuer": "HunterVaultApi",
    "Audience": "HunterVaultFrontend"
  },
  "IgdbApi": {
    "ClientId": "TU_CLIENT_ID_DE_TWITCH",
    "ClientSecret": "TU_CLIENT_SECRET_DE_TWITCH"
  },
  "Smtp": {
    "Email": "tu-cuenta@gmail.com",
    "Password": "TU_APP_PASSWORD_DE_GMAIL"
  }
}
```

Equivalente con `user-secrets` (más seguro, no se sube al repo):

```bash
dotnet user-secrets set "ConnectionStrings:HunterVault" "Server=localhost;Database=HunterVault;Trusted_Connection=True;TrustServerCertificate=True;"
dotnet user-secrets set "AppSettings:Token" "UNA_CLAVE_HMAC_SHA512_LARGA"
dotnet user-secrets set "IgdbApi:ClientId" "..."
dotnet user-secrets set "IgdbApi:ClientSecret" "..."
dotnet user-secrets set "Smtp:Email" "..."
dotnet user-secrets set "Smtp:Password" "..."
```

3. Ejecuta la API. Las migraciones se aplican automáticamente al arranque vía `app.Services.MigrateDb()`:

```bash
dotnet run
```

La API escucha en `http://localhost:5147` (HTTP) y `https://localhost:7004` (HTTPS). La documentación OpenAPI/Scalar está disponible en `http://localhost:5147/scalar` (solo en desarrollo).

> **¿Necesitas crear una nueva migración?** Como `HunterVaultContext` vive en `HunterVault.Infrastructure` y el composition root está en `HunterVault.Api`, los comandos de EF requieren ambos:
>
> ```bash
> dotnet ef migrations add NombreMigracion \
>   --project HunterVault.Infrastructure \
>   --startup-project HunterVault.Api
> ```

<h3>Configuración del Frontend (React + Vite)</h3>

1. Navega a la carpeta del Frontend:

```bash
cd huntervault-app/HunterVault.Frontend
```

2. Crea un archivo `.env.development` en la raíz de la carpeta del frontend:

```env
VITE_API_URL=http://localhost:5147/api
```

3. Instala las dependencias e inicia el servidor de desarrollo:

```bash
npm install
npm run dev
```

El frontend levanta en `http://localhost:5173` y proxy-ea `/api` al backend. La conexión SignalR se deriva de `VITE_API_URL` quitando el sufijo `/api`.

<h2 id="endpoints">📍 Endpoints Principales</h2>

Todos los endpoints están bajo `/api`. Las rutas autenticadas requieren `Authorization: Bearer <jwt>` y los grupos tienen rate limits específicos (`auth`: 3/10min, `search`: 20/min, `fixed`: 100/min).

**Auth** (`/api/Auth`)

| Ruta | Método | Descripción |
|---|---|---|
| `/check-username` | GET | Comprueba si un username está disponible. |
| `/register` | POST | Registra un nuevo usuario. Si se aporta email, requiere verificación posterior. |
| `/verify-email` | POST | Confirma el código de 6 dígitos enviado al email. |
| `/login` | POST | Autentica y devuelve `{ accessToken, refreshToken }`. |
| `/refresh` | POST | Renueva el JWT a partir del refresh token. |
| `/forgot-password` | POST | Envía un código de reset al email (responde igual exista o no, para no filtrar cuentas). |
| `/reset-password` | POST | Restablece la contraseña usando el código y revoca refresh tokens activos. |

**Games** (`/api/games`, autenticado)

| Ruta | Método | Descripción |
|---|---|---|
| `/` | GET | Devuelve la biblioteca del usuario actual. |
| `/{id}` | GET | Detalles de un juego propio. |
| `/` | POST | Añade un juego al vault (enriquece con IGDB y notifica a seguidores por SignalR). |
| `/{id}` | PUT | Actualiza un juego (re-enriquece si cambia el `igdbId`). |
| `/{id}` | DELETE | Elimina un juego del vault. |

**Profile** (`/api/profile`)

| Ruta | Método | Descripción |
|---|---|---|
| `/{username}` | GET | Perfil público con stats de XP y nivel. |
| `/` | PUT | Actualiza bio, avatar y banner del usuario autenticado. |
| `/search?query=` | GET | Busca usuarios por username (autenticado). |
| `/follow/{targetUserId}` | POST/DELETE | Sigue / deja de seguir a un usuario. |
| `/feed` | GET | Feed de actividad de los seguidos (paginado). |
| `/recommended` | GET | Top 5 usuarios recomendados por nivel. |

**IGDB** (`/api/igdb`, autenticado)

| Ruta | Método | Descripción |
|---|---|---|
| `/search?q=` | GET | Busca juegos en IGDB (cacheado 15 min). |
| `/details/id/{id}` | GET | Detalles completos de un juego IGDB (cacheado 24h). |

**Tiempo real**

| Ruta | Protocolo | Descripción |
|---|---|---|
| `/hubs/social` | SignalR | Hub que emite `ReceiveActivityUpdate(username, gameName, status, trophyPct?)` a los seguidores cuando un usuario crea o actualiza un juego. |


<h2 id="contribuir">📫 Contribuir</h2>

Si quieres contribuir al proyecto, sigue estos pasos:

1. Haz un Fork del repositorio.
2. Crea una rama para tu mejora: `git checkout -b feature/NombreDeTuMejora`
3. Sigue los patrones de commit (ej: `feat: add achievement badges`)
4. Abre un Pull Request explicando los cambios realizados y espera la revisión.

<h3>Documentación de ayuda</h3>

- [📝 Cómo crear un Pull Request](https://www.atlassian.com/es/git/tutorials/making-a-pull-request)
- [💾 Patrones de Commit](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716)
