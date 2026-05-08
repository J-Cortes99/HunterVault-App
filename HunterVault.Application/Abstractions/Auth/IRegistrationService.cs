using HunterVault.Application.Dtos.Auth;

namespace HunterVault.Application.Abstractions.Auth;

public enum RegistrationFailure
{
    UsernameTaken,
    EmailTaken
}

public record RegistrationResult(RegisteredUserDto? User, RegistrationFailure? Failure)
{
    public bool Succeeded => User is not null;
    public static RegistrationResult Success(RegisteredUserDto user) => new(user, null);
    public static RegistrationResult Failed(RegistrationFailure failure) => new(null, failure);
}

public interface IRegistrationService
{
    Task<RegistrationResult> RegisterAsync(UserDto request, CancellationToken cancellationToken = default);
    Task<bool> IsUsernameAvailableAsync(string username, CancellationToken cancellationToken = default);
}
