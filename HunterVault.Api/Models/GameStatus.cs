namespace HunterVault.Api.Models;

public enum GameStatus
{
    Backlog,      // Pendiente
    Playing,      // Jugando actualmente
    Completed,    // Completado
    Platinumed,   // Platinado (100% logros)
    Dropped       // Abandonado
}
