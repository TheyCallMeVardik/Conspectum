using System.Security.Claims;

namespace DiplomaProject.Shared.Extensions;

/// <summary>
/// Extension helpers for <see cref="ClaimsPrincipal"/>.
/// </summary>
public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Extracts the authenticated user's <c>sub</c> claim as a <see cref="Guid"/>.
    /// Throws <see cref="InvalidOperationException"/> when the claim is absent or malformed.
    /// </summary>
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var raw = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
            ?? principal.Claims.FirstOrDefault(c => c.Type == "sub")?.Value
            ?? throw new InvalidOperationException("JWT is missing 'sub' claim.");

        return Guid.Parse(raw);
    }
}
