using PointRealm.Server.Domain.ValueObjects;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Application.Services;

public sealed class RealmSettingsService : IRealmSettingsService
{
    public RealmSettings BuildRealmSettings(RealmSettingsRequest? request, RealmSettings? existing = null)
    {
        var deck = RuneDeck.Standard();

        if (request?.DeckType is not null)
        {
            deck = request.DeckType.ToUpperInvariant() switch
            {
                "FIBONACCI" => RuneDeck.Fibonacci(),
                "SHORT_FIBONACCI" => RuneDeck.ShortFibonacci(),
                "TSHIRT" => RuneDeck.TShirt(),
                "CUSTOM" when request.CustomDeckValues != null => RuneDeck.Custom(request.CustomDeckValues),
                _ => RuneDeck.Standard()
            };
        }
        else if (existing is not null)
        {
            deck = existing.Deck;
        }

        var autoReveal = request?.AutoReveal ?? existing?.AutoReveal ?? false;
        var allowAbstain = request?.AllowAbstain ?? existing?.AllowAbstain ?? true;
        var hideVoteCounts = request?.HideVoteCounts ?? existing?.HideVoteCounts ?? false;
        var allowEmojiReactions = request?.AllowEmojiReactions ?? existing?.AllowEmojiReactions ?? true;

        return new RealmSettings(deck, autoReveal, allowAbstain, hideVoteCounts, allowEmojiReactions);
    }

    public RealmSettingsDto MapToSettingsDto(RealmSettings settings)
    {
        return new RealmSettingsDto
        {
            Deck = new RuneDeckDto
            {
                Name = settings.Deck.Name,
                Cards = settings.Deck.Cards.Select(c => new RuneCardDto
                {
                    Label = c.Label,
                    Value = c.Value
                }).ToList()
            },
            AutoReveal = settings.AutoReveal,
            AllowAbstain = settings.AllowAbstain,
            HideVoteCounts = settings.HideVoteCounts,
            AllowEmojiReactions = settings.AllowEmojiReactions
        };
    }
}
