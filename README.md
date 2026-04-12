<h1 align="center" style="font-weight: bold;">HunterVault 🏆</h1>

<p align="center">
  <a href="#technologies">Technologies</a> •
  <a href="#started">Getting Started</a> •
  <a href="#routes">API Endpoints</a>
</p>

<p align="center"><b>HunterVault</b> is a full-stack platform designed for gamers to track their gaming library, manage their backlog, log trophies, and connect with other players. Powered by the IGDB API for comprehensive game data.</p>

<p align="center">
  <a href="https://huntervault.vercel.app">📱 Visit this Project (Live Demo)</a>
</p>

<h2 id="technologies">💻 Technologies</h2>

This project is built using a modern decoupled architecture, with the backend hosted on Azure and the frontend delivered via Vercel.

**Frontend:**
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) (UI Styling)

**Backend:**
- [ASP.NET Core 10](https://dotnet.microsoft.com/) (Web API)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/) (Code-first ORM)
- [SignalR](https://dotnet.microsoft.com/apps/aspnet/signalr) (Real-time social hub features)
- [IGDB API Integration](https://api-docs.igdb.com/) (Game database provider)

**Infrastructure & Deployment:**
- **Azure App Service:** Backend hosting
- **Azure SQL Database:** Relational database
- **Vercel:** Frontend hosting
- **GitHub Actions:** CI/CD Pipelines (`.github/workflows`)

<h2 id="started">🚀 Getting started</h2>

Here is how you can run the project locally for development.

<h3>Prerequisites</h3>

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js (v18 or higher)](https://nodejs.org/)
- [Git](https://git-scm.com/)
- An [IGDB / Twitch Developer Account](https://dev.twitch.tv/) to get API keys.

<h3>Cloning</h3>

```bash
git clone [https://github.com/j-cortes99/huntervault-app.git](https://github.com/j-cortes99/huntervault-app.git)
