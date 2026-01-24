using PointRealm.Shared.V1.Api;
using Xunit;

namespace PointRealm.Tests;

public sealed class HealthResponseTests
{
    [Fact]
    public void HealthResponseStoresStatus()
    {
        var response = new HealthResponse("ok", "1.0");

        Assert.Equal("ok", response.Status);
        Assert.Equal("1.0", response.Version);
    }
}
