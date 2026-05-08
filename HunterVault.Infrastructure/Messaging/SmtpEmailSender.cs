using System.Net;
using System.Net.Mail;
using HunterVault.Application.Abstractions.Messaging;
using HunterVault.Application.Configuration;
using Microsoft.Extensions.Options;

namespace HunterVault.Infrastructure.Messaging;

public class SmtpEmailSender(IOptions<SmtpOptions> options) : IEmailSender
{
    private readonly SmtpOptions _options = options.Value;

    public Task SendVerificationCodeAsync(string toEmail, string code, CancellationToken cancellationToken = default) =>
        SendCodeEmailAsync(
            toEmail, code,
            subject: "Tu código de verificación - HunterVault",
            heading: "Tu código de verificación",
            footer: "Si no has creado una cuenta en HunterVault, ignora este email.",
            cancellationToken);

    public Task SendPasswordResetCodeAsync(string toEmail, string code, CancellationToken cancellationToken = default) =>
        SendCodeEmailAsync(
            toEmail, code,
            subject: "Recupera tu contraseña - HunterVault",
            heading: "Tu código para restablecer la contraseña",
            footer: "Si no has solicitado restablecer tu contraseña, ignora este email y tu cuenta seguirá segura.",
            cancellationToken);

    private async Task SendCodeEmailAsync(string toEmail, string code, string subject, string heading, string footer, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.Email))
            throw new InvalidOperationException("SMTP email no configurado.");
        if (string.IsNullOrWhiteSpace(_options.Password))
            throw new InvalidOperationException("SMTP password no configurada.");

        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            Credentials = new NetworkCredential(_options.Email, _options.Password),
            EnableSsl = true
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(_options.Email, _options.FromName),
            Subject = subject,
            IsBodyHtml = true,
            Body = BuildHtmlBody(code, heading, footer)
        };
        mailMessage.To.Add(toEmail);

        try
        {
            await client.SendMailAsync(mailMessage, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new Exception($"Error al enviar el email vía SMTP: {ex.Message}", ex);
        }
    }

    private static string BuildHtmlBody(string code, string heading, string footer) => $@"
        <div style=""font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;"">
            <div style=""text-align: center; margin-bottom: 32px;"">
                <div style=""display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); padding: 16px; border-radius: 12px; margin-bottom: 16px;"">
                    🏆
                </div>
                <h1 style=""margin: 0; font-size: 24px; font-weight: 700;"">
                    Hunter<span style=""color: #fbbf24;"">Vault</span>
                </h1>
            </div>
            <h2 style=""text-align: center; font-size: 18px; color: #94a3b8; font-weight: 500; margin-bottom: 8px;"">
                {heading}
            </h2>
            <div style=""text-align: center; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 28px; margin: 24px 0;"">
                <span style=""font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #fbbf24;"">{code}</span>
            </div>
            <p style=""text-align: center; color: #64748b; font-size: 14px;"">
                Este código expira en <strong style=""color: #94a3b8;"">15 minutos</strong>.<br/>
                {footer}
            </p>
        </div>";
}
