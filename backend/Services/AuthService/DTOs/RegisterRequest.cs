namespace AuthService.DTOs;

/// <summary>Payload sent by the client to register a new account.</summary>
public sealed record RegisterRequest(string Email, string Password, string ConfirmPassword);
