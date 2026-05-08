using HunterVault.Domain.Entities;

namespace HunterVault.Application.Abstractions.Identity;

public interface IPasswordHasher
{
    string Hash(User user, string password);
    bool Verify(User user, string hashedPassword, string providedPassword);
}
