using PointRealm.Server.Application.Services;
using PointRealm.Server.Domain.ValueObjects;
using PointRealm.Shared.V1.Api;
using Xunit;

namespace PointRealm.Tests.Application;

public class RealmSettingsServiceTests
{
    [Fact]
    public void BuildRealmSettings_UsesRequestedDeckType()
    {
        var service = new RealmSettingsService();

        var settings = service.BuildRealmSettings(new RealmSettingsRequest
        {
            DeckType = "TSHIRT",
            AutoReveal = true,
            AllowAbstain = false,
            HideVoteCounts = true
        });

        Assert.Equal("T-Shirt", settings.Deck.Name);
        Assert.True(settings.AutoReveal);
        Assert.False(settings.AllowAbstain);
        Assert.True(settings.HideVoteCounts);
    }

    [Fact]
    public void BuildRealmSettings_UsesCustomDeckValues_WhenProvided()
    {
        var service = new RealmSettingsService();
        var labels = new List<string> { "1", "2", "XS" };

        var settings = service.BuildRealmSettings(new RealmSettingsRequest
        {
            DeckType = "CUSTOM",
            CustomDeckValues = labels
        });

        Assert.Equal("Custom", settings.Deck.Name);
        Assert.Equal(labels, settings.Deck.Cards.Select(c => c.Label).ToList());
        Assert.Equal(1, settings.Deck.Cards[0].Value);
        Assert.Equal(2, settings.Deck.Cards[1].Value);
        Assert.Null(settings.Deck.Cards[2].Value);
    }

    [Fact]
    public void BuildRealmSettings_FallsBackToExistingSettings_WhenRequestIsNull()
    {
        var service = new RealmSettingsService();
        var existing = new RealmSettings(RuneDeck.Fibonacci(), true, false, true);

        var settings = service.BuildRealmSettings(null, existing);

        Assert.Equal(existing.Deck.Name, settings.Deck.Name);
        Assert.True(settings.AutoReveal);
        Assert.False(settings.AllowAbstain);
        Assert.True(settings.HideVoteCounts);
    }

    [Fact]
    public void MapToSettingsDto_MapsDeckAndFlags()
    {
        var service = new RealmSettingsService();
        var settings = new RealmSettings(RuneDeck.ShortFibonacci(), true, true, false);

        var dto = service.MapToSettingsDto(settings);

        Assert.Equal("Short Fibonacci", dto.Deck.Name);
        Assert.Contains(dto.Deck.Cards, card => card.Label == "5" && card.Value == 5);
        Assert.True(dto.AutoReveal);
        Assert.True(dto.AllowAbstain);
        Assert.False(dto.HideVoteCounts);
    }
}
