namespace HunterVault.Api.Services;

public interface IEmailSenderService
{
    Task SendVerificationCodeAsync(string toEmail, string code);
    Task SendPasswordResetCodeAsync(string toEmail, string code);
}
