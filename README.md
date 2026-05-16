<h1 align="center" style="font-weight: bold;">HunterVault 🏆</h1>

<p align="center">
  <a href="#tecnologias">Tecnologías</a> •
  <a href="#arquitectura">Arquitectura</a> •
  <a href="#instalacion">Instalación local</a> •
  <a href="#despliegue">Despliegue en producción</a> •
  <a href="#cicd">CI/CD</a> •
  <a href="#endpoints">API Endpoints</a> •
  <a href="#contribuir">Contribuir</a>
</p>

<p align="center"><b>HunterVault</b> es una plataforma full-stack diseñada para gamers. Permite gestionar bibliotecas de juegos, seguir el progreso del "backlog", registrar trofeos y conectar con otros jugadores en tiempo real. Utiliza la API de IGDB para obtener datos precisos de miles de videojuegos.</p>

<p align="center">
  <a href="https://huntervault.vercel.app">📱 Visitar el Proyecto (Demo en vivo)</a>
</p>

<h2 id="tecnologias">💻 Tecnologías</h2>

El proyecto utiliza una arquitectura desacoplada moderna: backend en contenedores Docker sobre una VM ARM gratuita de Oracle Cloud, frontend en Vercel.

**Frontend:**
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) (Estilos)
- [TanStack Query](https://tanstack.com/query) (Cache de servidor)
- [Axios](https://axios-http.com/) (Cliente HTTP)
- HUD futurista: tipografías Chakra Petch + Rajdhani + JetBrains Mono, paleta cyan/ámbar, paneles biselados con clip-path y scanlines.

**Backend:**
- [ASP.NET Core 10](https://dotnet.microsoft.com/) (Web API, Minimal APIs)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/) (ORM Code-first)
- [Npgsql](https://www.npgsql.org/) (PostgreSQL provider para EF Core)
- [SignalR](https://dotnet.microsoft.com/apps/aspnet/signalr) (Funciones sociales en tiempo real, vía WebSockets)
- [IGDB API](https://api-docs.igdb.com/) (Proveedor de datos de videojuegos)
- JWT Bearer + ASP.NET Identity password hashing
- Gmail SMTP para verificación de email y reset de contraseña

**Infraestructura (producción):**
- **Oracle Cloud Always Free:** VM ARM Ampere A1 (1 OCPU / 6 GB RAM) en `eu-madrid-1`. Hospeda toda la pila backend sin coste.
- **Docker + Docker Compose:** orquesta tres contenedores (`api`, `postgres`, `caddy`).
- **PostgreSQL 17:** base de datos relacional (contenedor con volumen persistente).
- **Caddy 2:** reverse-proxy con HTTPS automático vía Let's Encrypt + soporte WebSocket para SignalR.
- **DuckDNS:** dominio dinámico gratuito apuntando a la IP pública de la VM.
- **GitHub Actions + GHCR:** CI/CD que en cada push a `main` con cambios en el backend construye una imagen ARM64 con `buildx`, la publica en GitHub Container Registry y la despliega por SSH en la VM.
- **Vercel:** hosting del Frontend (deploy automático en cada push que toque `HunterVault.Frontend/**`).

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
  ├── Persistence/          HunterVaultContext + migraciones EF Core (Npgsql).
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

<h2 id="instalacion">🚀 Instalación local</h2>

<h3>Prerrequisitos</h3>

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js (v18 o superior)](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para levantar PostgreSQL fácil) o un PostgreSQL local nativo
- [Git](https://git-scm.com/)
- Una cuenta de [Twitch Developer](https://dev.twitch.tv/) para las llaves de la API de IGDB.

<h3>Clonación</h3>

```bash
git clone https://github.com/j-cortes99/huntervault-app.git
cd huntervault-app
```

<h3>1. Levantar PostgreSQL local (rápido con Docker)</h3>

```bash
docker run --name huntervault-db \
  -e POSTGRES_DB=huntervault \
  -e POSTGRES_USER=huntervault \
  -e POSTGRES_PASSWORD=devpassword \
  -p 5432:5432 \
  -d postgres:17-alpine
```

<h3>2. Configuración del Backend (ASP.NET Core)</h3>

Configura los secretos vía `dotnet user-secrets` (recomendado) desde la carpeta de la API:

```bash
cd HunterVault.Api
dotnet user-secrets set "ConnectionStrings:HunterVault" "Host=localhost;Port=5432;Database=huntervault;Username=huntervault;Password=devpassword"
dotnet user-secrets set "AppSettings:Token" "UNA_CLAVE_HMAC_SHA512_LARGA_AL_MENOS_64_BYTES"
dotnet user-secrets set "IgdbApi:ClientId" "..."
dotnet user-secrets set "IgdbApi:ClientSecret" "..."
dotnet user-secrets set "Smtp:Email" "..."
dotnet user-secrets set "Smtp:Password" "..."
```

Ejecuta la API. Las migraciones se aplican automáticamente al arranque vía `app.Services.MigrateDb()`:

```bash
dotnet run
```

La API escucha en `http://localhost:5147` (HTTP) y `https://localhost:7004` (HTTPS). La documentación OpenAPI/Scalar está disponible en `http://localhost:5147/scalar` (solo en desarrollo).

> **¿Necesitas crear una nueva migración?** Como `HunterVaultContext` vive en `HunterVault.Infrastructure` y el composition root está en `HunterVault.Api`, los comandos de EF requieren ambos:
>
> ```bash
> dotnet ef migrations add NombreMigracion \
>   --project HunterVault.Infrastructure \
>   --startup-project HunterVault.Api \
>   --output-dir Persistence/Migrations
> ```

<h3>3. Configuración del Frontend (React + Vite)</h3>

```bash
cd HunterVault.Frontend
```

Crea un archivo `.env.development` en la raíz de la carpeta del frontend:

```env
VITE_API_URL=http://localhost:5147/api
```

Instala las dependencias e inicia el servidor de desarrollo:

```bash
npm install
npm run dev
```

El frontend levanta en `http://localhost:5173` y proxy-ea `/api` al backend. La conexión SignalR se deriva de `VITE_API_URL` quitando el sufijo `/api`.

<h2 id="despliegue">🐳 Despliegue en producción (Docker en Oracle Cloud)</h2>

El backend se despliega como tres contenedores orquestados con `docker-compose.yml` sobre una VM ARM gratuita de Oracle Cloud.

<h3>Arquitectura de contenedores</h3>

```
┌─────────────────────────────────────────────────────────┐
│  VM Oracle Cloud (Ubuntu 22.04 ARM64, Madrid AD-1)       │
│                                                          │
│  ┌──────────┐    ┌─────────────┐    ┌──────────────┐   │
│  │ caddy:2  │───▶│ huntervault │───▶│ postgres:17  │   │
│  │ :80 :443 │    │  -api :8080 │    │     :5432    │   │
│  └──────────┘    └─────────────┘    └──────────────┘   │
│   Let's Encrypt   .NET 10 ARM       Volumen persistente │
│   + WebSocket     ASP.NET Core      (postgres_data)     │
└─────────────────────────────────────────────────────────┘
            ▲
            │ HTTPS
            │
   hunter-vault.duckdns.org
            ▲
            │ peticiones API + WS
            │
     ┌──────┴──────┐
     │   Vercel    │
     │  (Frontend) │
     └─────────────┘
```

<h3>Despliegue inicial</h3>

1. **Crear VM ARM en Oracle Cloud** (Ubuntu 22.04 aarch64, shape `VM.Standard.A1.Flex`, Always Free-eligible). Abrir puertos 22, 80 y 443 en la Security List **y** en `iptables` del sistema (Oracle preconfigura iptables muy restrictivo).

2. **Instalar Docker** en la VM:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker ubuntu
   ```

3. **Clonar el repo y configurar `.env`** (basado en `.env.example`):
   ```bash
   git clone https://github.com/j-cortes99/huntervault-app.git ~/huntervault
   cd ~/huntervault
   cp .env.example .env
   nano .env   # rellenar todos los valores
   ```

4. **Crear subdominio en [DuckDNS](https://www.duckdns.org)** apuntando a la IP pública de la VM. Poner ese mismo dominio en `.env` como `DOMAIN`.

5. **Levantar el stack**:
   ```bash
   docker compose up -d --build
   ```
   La primera vez tarda 5-10 min (compila la imagen .NET, descarga Postgres y Caddy). Caddy obtiene automáticamente el certificado SSL de Let's Encrypt.

<h3>Actualizar el backend tras cambios en el código</h3>

**Lo normal es no hacer nada**: el [pipeline de CI/CD](#cicd) se encarga automáticamente en cada push a `main`. EF Core aplica las nuevas migraciones al reiniciar la API.

Si por algún motivo necesitas hacerlo a mano desde la VM (ej. emergencia, GitHub caído):

```bash
cd ~/huntervault
git pull
docker compose pull api          # descarga la última imagen de GHCR
docker compose up -d --no-deps api
```

Y si quieres reconstruir la imagen en la propia VM en lugar de bajarla de GHCR:

```bash
docker compose up -d --build api
```

<h3>Variables de entorno (`.env`)</h3>

Plantilla completa en `.env.example`. Las claves obligatorias son:

| Variable | Descripción |
|---|---|
| `POSTGRES_PASSWORD` | Password de la BD (generada aleatoria, p.ej. `openssl rand -base64 32`). |
| `JWT_TOKEN` | Clave HMAC-SHA512 para firmar JWTs (>=64 bytes aleatorios). |
| `IGDB_CLIENT_ID` / `IGDB_CLIENT_SECRET` | Credenciales OAuth de Twitch para acceder a IGDB. |
| `SMTP_EMAIL` / `SMTP_PASSWORD` | Cuenta de Gmail + app password para verificación de email. |
| `DOMAIN` | Subdominio DuckDNS (o propio) para HTTPS — ej. `hunter-vault.duckdns.org`. |

> ⚠️ El archivo `.env` está en `.gitignore` y nunca debe commitearse. Mantén una copia segura aparte (gestor de contraseñas).

<h3>Comandos útiles</h3>

```bash
docker compose ps                  # estado de los contenedores
docker compose logs api --tail 50  # logs de la API
docker compose logs caddy          # logs del reverse proxy (útil para SSL)
docker compose restart api         # reiniciar solo la API (resetea rate limiter en memoria)
docker compose down                # parar todo (mantiene volúmenes)
docker compose down -v             # parar y BORRAR la BD (cuidado)
```

<h3>Backup de PostgreSQL</h3>

Para hacer un backup manual del volumen de la BD:

```bash
docker exec huntervault-db pg_dump -U huntervault huntervault > backup-$(date +%F).sql
```

<h2 id="cicd">⚙️ CI/CD</h2>

El backend tiene un pipeline automático en GitHub Actions (`.github/workflows/deploy.yml`) que se dispara en cada push a `main` que toque código backend (`HunterVault.*/`, `Dockerfile`, `docker-compose.yml`, `Caddyfile`) o manualmente desde la pestaña Actions del repo.

<h3>Pipeline</h3>

```
push a main (paths backend)
        │
        ▼
┌──────────────────────────┐
│ Job 1 · build-and-push   │   Runner x86 de GitHub (~2 min)
│ ┌──────────────────────┐ │
│ │ Setup QEMU + Buildx  │ │   Emulación ARM64
│ │ Login GHCR           │ │   con GITHUB_TOKEN
│ │ Build imagen ARM64   │ │   cross-compile vía Dockerfile
│ │ Push a ghcr.io       │ │   tags: latest + sha-XXXXXXX
│ └──────────────────────┘ │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ Job 2 · deploy           │   Otro runner (~30 s)
│ ┌──────────────────────┐ │
│ │ SSH a la VM Oracle   │ │   appleboy/ssh-action
│ │   git pull           │ │   actualiza compose/Caddyfile
│ │   docker compose     │ │   pull api → up -d --no-deps api
│ │   docker image prune │ │   limpia capas viejas
│ └──────────────────────┘ │
└──────────────────────────┘

Total: ~2-3 min · downtime efectivo ~5 s
```

El frontend NO se redespliega por este pipeline — Vercel lo hace solo cuando cambia algo en `HunterVault.Frontend/**`.

<h3>Secrets de GitHub necesarios</h3>

Configurados en **Settings → Secrets and variables → Actions** del repo:

| Secret | Contenido |
|---|---|
| `VM_HOST` | IP pública de la VM Oracle. |
| `VM_USER` | `ubuntu`. |
| `VM_SSH_KEY` | Clave privada SSH completa (la pareja de la que añadiste a `~/.ssh/authorized_keys` en la VM). |

`GITHUB_TOKEN` lo provee GitHub automáticamente para autenticarse contra GHCR.

<h3>GitHub Container Registry (GHCR)</h3>

Las imágenes se publican en `ghcr.io/j-cortes99/huntervault-api`. El package está marcado como **público** para que:

- La VM pueda hacer `docker compose pull api` manualmente sin tener que gestionar tokens.
- El storage no cuente contra la cuota de packages privados (500 MB gratis), ya que los packages públicos son ilimitados.
- Cualquiera pueda inspeccionar/auditar la imagen (no contiene secretos: `.env` queda fuera por `.dockerignore`).

Los tags activos son `latest` (siempre apunta al último commit de `main`) y `sha-XXXXXXX` (hash corto del commit, útil para rollback).

<h3>Rollback a una versión anterior</h3>

Si un deploy rompe algo, vuelve a una imagen anterior identificándola por su tag de commit:

```bash
# En la VM
cd ~/huntervault
docker pull ghcr.io/j-cortes99/huntervault-api:sha-XXXXXXX
docker tag ghcr.io/j-cortes99/huntervault-api:sha-XXXXXXX ghcr.io/j-cortes99/huntervault-api:latest
docker compose up -d --no-deps api
```

O simplemente revierte el commit problemático en GitHub y deja que el pipeline reconstruya.

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
| `/hubs/social` | SignalR (WebSocket) | Hub que emite `ReceiveActivityUpdate(username, gameName, status, trophyPct?)` a los seguidores cuando un usuario crea o actualiza un juego. |


<h2 id="contribuir">📫 Contribuir</h2>

Si quieres contribuir al proyecto, sigue estos pasos:

1. Haz un Fork del repositorio.
2. Crea una rama para tu mejora: `git checkout -b feature/NombreDeTuMejora`
3. Sigue los patrones de commit (ej: `feat: add achievement badges`)
4. Abre un Pull Request explicando los cambios realizados y espera la revisión.

<h3>Documentación de ayuda</h3>

- [📝 Cómo crear un Pull Request](https://www.atlassian.com/es/git/tutorials/making-a-pull-request)
- [💾 Patrones de Commit](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716)
