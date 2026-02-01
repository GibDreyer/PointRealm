namespace PointRealm.Server.Infrastructure.Services;

public class UserTokenSettings
{
    public const string SectionName = "UserToken";
    public string Key { get; set; } = string.Empty;
    public int ExpirationHours { get; set; } = 168;
}
