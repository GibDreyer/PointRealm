namespace PointRealm.Server.Infrastructure.Services;

public class UserTokenSettings
{
    public const string SectionName = "UserToken";
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// Access token lifetime in minutes. Defaults to 30 minutes for phase-1 hardening.
    /// </summary>
    public int AccessTokenLifetimeMinutes { get; set; } = 30;

    /// <summary>
    /// Legacy compatibility field. If configured (> 0), this value is converted into minutes.
    /// </summary>
    public int ExpirationHours { get; set; }

    public int GetEffectiveLifetimeMinutes()
    {
        if (ExpirationHours > 0)
        {
            return ExpirationHours * 60;
        }

        return AccessTokenLifetimeMinutes > 0 ? AccessTokenLifetimeMinutes : 30;
    }
}
