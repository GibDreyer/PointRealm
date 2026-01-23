namespace PointRealm.Server.Application.Validators;

public sealed class RealmNameValidator : IRealmNameValidator
{
    public bool IsValid(string name, out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            errorMessage = "Name is required.";
            return false;
        }

        if (name.Length > 100)
        {
            errorMessage = "Name must be 100 characters or fewer.";
            return false;
        }

        errorMessage = null;
        return true;
    }
}
