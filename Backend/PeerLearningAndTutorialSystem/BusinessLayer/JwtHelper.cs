using Microsoft.IdentityModel.Tokens;
using PeerLearningAndTutorialSystem.Models;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Web;
namespace PeerLearningAndTutorialSystem.BusinessLayer
{
    public class JwtHelper
    {// Store this in Web.config appSettings: <add key="JwtSecret" value="your_secret_key_min_32_chars" />
        private readonly string _secret;
        private readonly int _expiryMinutes;

        public JwtHelper()
        {
            _secret = System.Configuration.ConfigurationManager.AppSettings["JwtSecret"]
                      ?? "PeerLearningPlatformSecret2025!!Key";
            _expiryMinutes = 1440; // 24 hours
        }

        public string GenerateToken(UserModel user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_secret);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("userId",   user.UserId.ToString()),
                    new Claim("email",    user.Email),
                    new Claim("roleName", user.RoleName ?? ""),
                    new Claim("roleId",   user.RoleId.ToString()),
                    new Claim(ClaimTypes.Name, user.FullName ?? "")
                }),
                Expires = DateTime.UtcNow.AddMinutes(_expiryMinutes),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public ClaimsPrincipal ValidateToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_secret);

            try
            {
                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero
                }, out _);
                return principal;
            }
            catch
            {
                return null;
            }
        }

        public int GetUserIdFromToken(string token)
        {
            var principal = ValidateToken(token);
            if (principal == null) return 0;
            var claim = principal.FindFirst("userId");
            return claim != null ? int.Parse(claim.Value) : 0;
        }

        public string GetRoleFromToken(string token)
        {
            var principal = ValidateToken(token);
            return principal?.FindFirst("roleName")?.Value;
        }
    }
}