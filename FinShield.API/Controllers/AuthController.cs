using FinShield.API.DTOs;
using FinShield.Core.Entities;
using FinShield.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FinShield.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _users;
        private readonly IConfiguration _config;

        public AuthController(IUserRepository users, IConfiguration config)
        {
            _users = users;
            _config = config;
        }

        /// <summary>
        /// Registers a new user account.
        /// Hashes the password using BCrypt before storing it.
        /// Returns a JWT token so the user is immediately logged in after registering.
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
        {
            // Check if email is already taken
            if (await _users.ExistsAsync(req.Email))
                return Conflict("Email already registered.");

            // Never store plain text passwords - always hash them
            // BCrypt automatically handles salting so rainbow table attacks won't work
            var user = new AppUser
            {
                Email = req.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                FirstName = req.FirstName,
                LastName = req.LastName,
                Role = "User"
            };

            await _users.AddAsync(user);

            // Return a token immediately so the frontend can log the user in
            return Ok(new AuthResponse(GenerateToken(user), user.Email, user.FirstName, user.Role));
        }

        /// <summary>
        /// Logs in an existing user.
        /// Verifies the password against the stored BCrypt hash.
        /// Returns a JWT token the frontend stores and sends with every request.
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
        {
            var user = await _users.GetByEmailAsync(req.Email);

            // BCrypt.Verify compares the plain text password against the stored hash
            // Returns false if user not found or password is wrong - same error message for security
            if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Unauthorized("Invalid credentials.");

            // Prevent suspended users from logging in
            if (!user.IsActive)
                return Forbid();

            return Ok(new AuthResponse(GenerateToken(user), user.Email, user.FirstName, user.Role));
        }

        /// <summary>
        /// Generates a JWT token for a user.
        /// The token contains claims (user id, email, role) that the API reads
        /// on every request to know who is making the call.
        /// Token expires after 7 days.
        /// </summary>
        private string GenerateToken(AppUser user)
        {
            // The signing key must match what is configured in Program.cs
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

            // Claims are pieces of information embedded inside the token
            // The frontend cannot modify these without invalidating the token
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FirstName),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}