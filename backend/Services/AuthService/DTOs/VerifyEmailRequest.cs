namespace AuthService.DTOs;

public sealed record VerifyEmailRequest(string Code);
public sealed record ResendVerificationRequest(string Email);
public sealed record ForgotPasswordRequest(string Email);
public sealed record ResetPasswordRequest(string Email, string Code, string NewPassword);
