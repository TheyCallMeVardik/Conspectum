namespace AuthService.DTOs;

/// <summary>Payload sent by the client to authenticate.</summary>
public sealed record LoginRequest(string Email, string Password);
