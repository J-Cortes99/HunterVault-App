<h1 align="center" style="font-weight: bold;">HunterVault 🏆</h1>

<p align="center">
  <a href="#tecnologias">Tecnologías</a> •
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
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) (Estilos)
- [Axios](https://axios-http.com/) (Cliente HTTP)

**Backend:**
- [ASP.NET Core 10](https://dotnet.microsoft.com/) (Web API)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/) (ORM Code-first)
- [SignalR](https://dotnet.microsoft.com/apps/aspnet/signalr) (Funciones sociales en tiempo real)
- [IGDB API](https://api-docs.igdb.com/) (Proveedor de datos de videojuegos)

**Infraestructura:**
- **Azure App Service:** Hosting del Backend.
- **Azure SQL Database:** Base de datos relacional.
- **Vercel:** Hosting del Frontend.
- **GitHub Actions:** Pipelines de CI/CD automáticos.

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

1. Navega a la carpeta de la API:

```bash
cd huntervault-app/HunterVault.Api
```

2. Configura tu archivo `appsettings.Development.json` con tus credenciales de base de datos e IGDB:

```json
{
  "ConnectionStrings": {
    "HunterVaultDb": "Server=localhost;Database=HunterVault;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "UNA_CLAVE_SUPER_SECRETA_DE_AL_MENOS_32_CARACTERES",
    "Issuer": "HunterVaultApi"
  },
  "IGDB": {
    "ClientId": "TU_CLIENT_ID_DE_TWITCH",
    "ClientSecret": "TU_CLIENT_SECRET_DE_TWITCH"
  }
}
```

3. Aplica las migraciones de la base de datos y ejecuta:

```bash
dotnet ef database update
dotnet run
```

<h3>Configuración del Frontend (React + Vite)</h3>

1. Navega a la carpeta del Frontend:

```bash
cd huntervault-app/HunterVault.Frontend
```

2. Crea un archivo `.env.development` en la raíz de la carpeta del frontend:

```env
VITE_API_URL=https://localhost:7147/api
```

3. Instala las dependencias e inicia el servidor de desarrollo:

```bash
npm install
npm run dev
```

<h2 id="endpoints">📍 Endpoints Principales</h2>

| Ruta | Método | Descripción |
|---|---|---|
| `/api/auth/register` | POST | Registra un nuevo usuario. |
| `/api/auth/login` | POST | Autentica al usuario y devuelve el token JWT. |
| `/api/games` | GET | Obtiene la biblioteca de juegos del usuario. |
| `/api/games` | POST | Añade un nuevo juego al vault del usuario. |
| `/api/igdb/search` | GET | Busca juegos por nombre en la base de datos de IGDB. |
| `/api/profile` | GET | Obtiene el perfil y la experiencia (XP) del usuario. |


<h2 id="contribuir">📫 Contribuir</h2>

Si quieres contribuir al proyecto, sigue estos pasos:

1. Haz un Fork del repositorio.
2. Crea una rama para tu mejora: `git checkout -b feature/NombreDeTuMejora`
3. Sigue los patrones de commit (ej: `feat: add achievement badges`)
4. Abre un Pull Request explicando los cambios realizados y espera la revisión.

<h3>Documentación de ayuda</h3>

- [📝 Cómo crear un Pull Request](https://www.atlassian.com/es/git/tutorials/making-a-pull-request)
- [💾 Patrones de Commit](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716)
