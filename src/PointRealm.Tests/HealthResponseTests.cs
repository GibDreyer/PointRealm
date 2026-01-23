using PointRealm.Shared.Contracts;
using Xunit;

namespace PointRealm.Tests;

public sealed class HealthResponseTests
{
    [Fact]
    public void HealthResponseStoresStatus()
    {
        var response = new HealthResponse("ok");

        Assert.Equal("ok", response.Status);
    }
}
