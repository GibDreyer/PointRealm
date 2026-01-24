using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace PointRealm.Server.Api.Hubs;

[Authorize]
public class RealmHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var realmId = Context.User?.FindFirst("realmId")?.Value;
        
        if (string.IsNullOrEmpty(realmId))
        {
            Context.Abort();
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, realmId);
        await base.OnConnectedAsync();
    }
}
