namespace PointRealm.Server.Application.Validators;

public interface IRealmNameValidator
{
    bool IsValid(string name, out string? errorMessage);
}
