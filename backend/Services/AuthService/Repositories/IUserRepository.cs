using AuthService.Entities;

namespace AuthService.Repositories;

/// <summary>
/// Abstraction over user persistence operations.
/// </summary>
public interface IUserRepository
{
    /// <summary>Finds a user by their email address. Returns <c>null</c> when not found.</summary>
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);

    /// <summary>Finds a user by their primary key. Returns <c>null</c> when not found.</summary>
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Persists a new user to the database.</summary>
    Task AddAsync(User user, CancellationToken ct = default);

    /// <summary>Removes a user from the database (call SaveChangesAsync to commit).</summary>
    void Remove(User user);

    /// <summary>Finds a user by a valid (non-expired) email verification code.</summary>
    Task<User?> GetByVerificationCodeAsync(string code, CancellationToken ct = default);

    /// <summary>Finds a user by a valid (non-expired) password reset code.</summary>
    Task<User?> GetByResetCodeAsync(string code, CancellationToken ct = default);

    /// <summary>Commits pending changes to the database.</summary>
    Task SaveChangesAsync(CancellationToken ct = default);
}
