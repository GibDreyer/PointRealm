namespace PointRealm.Shared.V1.Api;

/// <summary>
/// Request to register a new user account.
/// </summary>
public record RegisterRequest(string Email, string Password, string? DisplayName);

/// <summary>
/// Request to log in with email and password.
/// </summary>
public record LoginRequest(string Email, string Password, bool RememberMe);

/// <summary>
/// Request to initiate password reset.
/// </summary>
public record ForgotPasswordRequest(string Email);

/// <summary>
/// Request to reset password with token.
/// </summary>
public record ResetPasswordRequest(string Email, string Token, string NewPassword);

/// <summary>
/// Response containing password reset token (for dev/test purposes).
/// </summary>
public record PasswordResetTokenResponse(string Email, string Token);

/// <summary>
/// Request to update user profile.
/// </summary>
public record UpdateProfileRequest(string? DisplayName, string? ProfileImageUrl);

/// <summary>
/// User profile information.
/// </summary>
public record UserProfileResponse(string Id, string Email, string? DisplayName, string? ProfileImageUrl);

/// <summary>
/// Authentication response with access token.
/// </summary>
public record AuthTokenResponse(string AccessToken, DateTime ExpiresAt, UserProfileResponse User);
