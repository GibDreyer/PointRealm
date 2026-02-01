using Microsoft.AspNetCore.Mvc;

namespace PointRealm.Server.Api.Services;

public static class ApiProblemDetailsFactory
{
    public static ObjectResult CreateProblem(int statusCode, string title, string detail, string type)
    {
        return new ObjectResult(new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Type = type
        })
        {
            StatusCode = statusCode
        };
    }
}
