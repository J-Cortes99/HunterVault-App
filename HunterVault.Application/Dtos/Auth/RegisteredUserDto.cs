namespace HunterVault.Application.Dtos.Auth;

public record RegisteredUserDto(
    Guid Id,
    string Username,
    string? Email,
    bool EmailVerified
);
