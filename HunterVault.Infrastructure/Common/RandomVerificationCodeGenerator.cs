using HunterVault.Application.Abstractions.Time;

namespace HunterVault.Infrastructure.Common;

public class RandomVerificationCodeGenerator : IVerificationCodeGenerator
{
    public string Generate() => Random.Shared.Next(100000, 999999).ToString();
}
