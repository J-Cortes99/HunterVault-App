using HunterVault.Application.Abstractions.Identity;
using HunterVault.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace HunterVault.Infrastructure.Identity;

public class AspNetIdentityPasswordHasher : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(User user, string password) =>
        _hasher.HashPassword(user, password);

    public bool Verify(User user, string hashedPassword, string providedPassword) =>
        _hasher.VerifyHashedPassword(user, hashedPassword, providedPassword) != PasswordVerificationResult.Failed;
}
