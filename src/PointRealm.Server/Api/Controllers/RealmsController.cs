using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Api.Models;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Contracts;

namespace PointRealm.Server.Api.Controllers;

[ApiController]
[Route("api/realms")]
public sealed class RealmsController : ControllerBase
{
    private readonly IRealmService _service;

    public RealmsController(IRealmService service)
    {
        _service = service;
    }

    [HttpPost]
    [ProducesResponseType(typeof(RealmDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAsync(CreateRealmRequest request, CancellationToken cancellationToken)
    {
        var result = await _service.CreateAsync(request.Name, cancellationToken);

        if (!result.IsSuccess)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: result.Error.Code, detail: result.Error.Message);
        }

        return CreatedAtAction(nameof(GetByIdAsync), new { id = result.Value!.Id }, result.Value);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RealmDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var result = await _service.GetAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            var statusCode = result.Error.Code == "NotFound"
                ? StatusCodes.Status404NotFound
                : StatusCodes.Status400BadRequest;

            return Problem(statusCode: statusCode, title: result.Error.Code, detail: result.Error.Message);
        }

        return Ok(result.Value);
    }
}
