using Microsoft.AspNetCore.Mvc;
using PointRealm.Shared.Contracts;

namespace PointRealm.Server.Api.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(HealthResponse), StatusCodes.Status200OK)]
    public IActionResult Get() => Ok(new HealthResponse("ok"));
}
