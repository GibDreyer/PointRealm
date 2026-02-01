using Microsoft.AspNetCore.Identity;

namespace PointRealm.Server.Domain.Entities;

public sealed class ApplicationUser : IdentityUser
{
    public string? DisplayName { get; set; }
    public string? ProfileImageUrl { get; set; }
}
