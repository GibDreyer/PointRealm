namespace PointRealm.Server.Common.Errors;

public sealed record Error(string Code, string Message)
{
    public static Error None => new("None", string.Empty);
    public static Error Validation(string message) => new("Validation", message);
    public static Error NotFound(string message) => new("NotFound", message);
}
