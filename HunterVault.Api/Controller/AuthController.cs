using HunterVault.Api.Entities;
using HunterVault.Api.Models;
using HunterVault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;


namespace HunterVault.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimiting("auth")]
    public class AuthController(IAuthService authService) : ControllerBase
    {
        public static User user = new User();

        [HttpGet("check-username")]
        [EnableRateLimiting("search")]
        public async Task<IActionResult> CheckUsername([FromQuery] string username)
        {
            if (string.IsNullOrWhiteSpace(username) || username.Length < 3 || username.Length > 20)
                return Ok(new { available = false });

            var available = await authService.IsUsernameAvailableAsync(username.Trim());
            return Ok(new { available });
        }


        [HttpPost("register")]
        public async Task<ActionResult<User>> Register(UserDto request)
        {
            var user = await authService.RegisterAsync(request);

            if (user == null)
            {
                return BadRequest("El usuario o el email ya existe.");
            }

            // Si se registró con email, necesita verificarlo
            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                return Ok(new { requiresVerification = true, email = request.Email });
            }

            return Ok(user);
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail(EmailVerificationDto request)
        {
            var success = await authService.VerifyEmailAsync(request);

            if (!success)
            {
                return BadRequest("Código inválido o expirado.");
            }

            return Ok(new { message = "Email verificado correctamente. Ya puedes iniciar sesión." });
        }

        [HttpPost("login")]
        public async Task<ActionResult<TokenResponseDto>> Login(UserDto request)
        {
            var result = await authService.LoginAsync(request);

            if (result == null)
            {
                return BadRequest("Invalid username or password.");
            }

            return Ok(result);
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<TokenResponseDto>> RefreshToken(RefreshTokenRequestDto request)
        {
            var result = await authService.RefreshTokenAsync(request);

            if (result == null)
            {
                return BadRequest("Invalid refresh token.");
            }

            return Ok(result);
        }

        [Authorize]
        [HttpGet]
        public IActionResult AuthenticatedOnlyEndpoint()
        {
            return Ok("You are authenticated!");
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin")]
        public IActionResult AdminOnlyEndpoint()
        {
            return Ok("You are an admin!");
        }
    }
}
