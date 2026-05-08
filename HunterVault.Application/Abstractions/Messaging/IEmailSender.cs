namespace HunterVault.Application.Abstractions.Messaging;

public interface IEmailSender
{
    Task SendVerificationCodeAsync(string toEmail, string code, CancellationToken cancellationToken = default);
    Task SendPasswordResetCodeAsync(string toEmail, string code, CancellationToken cancellationToken = default);
}
