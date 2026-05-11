using AuthService.Data;
using AuthService.Entities;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IUserRepository"/>.
/// </summary>
public sealed class UserRepository(AuthDbContext db) : IUserRepository
{
    /// <inheritdoc />
    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant(), ct);

    /// <inheritdoc />
    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.Users.FindAsync([id], ct).AsTask();

    /// <inheritdoc />
    public async Task AddAsync(User user, CancellationToken ct = default) =>
        await db.Users.AddAsync(user, ct);

    /// <inheritdoc />
    public Task<User?> GetByVerificationCodeAsync(string code, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(
            u => u.EmailVerificationCode == code && u.EmailVerificationCodeExpiry > DateTime.UtcNow, ct);

    public Task<User?> GetByResetCodeAsync(string code, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(
            u => u.PasswordResetCode == code && u.PasswordResetCodeExpiry > DateTime.UtcNow, ct);

    /// <inheritdoc />
    public void Remove(User user) => db.Users.Remove(user);

    /// <inheritdoc />
    public Task SaveChangesAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);
}
