namespace HunterVault.Application.Abstractions.Identity;

public interface IUserContext
{
    Guid? UserId { get; }
    string? Username { get; }
}
