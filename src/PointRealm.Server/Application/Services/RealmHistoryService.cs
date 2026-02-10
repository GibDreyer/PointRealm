using PointRealm.Server.Domain.Entities;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Application.Services;

public sealed class RealmHistoryService : IRealmHistoryService
{
    public RealmHistoryResponse BuildRealmHistory(Realm realm)
    {
        var questHistories = realm.Quests
            .OrderBy(q => q.OrderIndex)
            .Select(quest =>
            {
                var completedEncounters = realm.Encounters
                    .Where(e => e.QuestId == quest.Id && e.Status == EncounterStatus.Revealed)
                    .OrderBy(e => e.Id)
                    .Select(encounter =>
                    {
                        var votes = encounter.Votes.Select(v =>
                        {
                            var member = realm.Members.FirstOrDefault(m => m.Id == v.PartyMemberId);
                            return new VoteHistory
                            {
                                MemberId = v.PartyMemberId,
                                MemberName = member?.Name ?? "Unknown",
                                VoteValue = v.Value.Label
                            };
                        }).ToList();

                        var distribution = votes
                            .GroupBy(v => v.VoteValue)
                            .ToDictionary(g => g.Key, g => g.Count());

                        return new EncounterHistory
                        {
                            EncounterId = encounter.Id,
                            CompletedAt = DateTime.UtcNow,
                            SealedOutcome = encounter.Outcome,
                            Votes = votes,
                            Distribution = distribution
                        };
                    }).ToList();

                return new QuestHistory
                {
                    QuestId = quest.Id,
                    Title = quest.Title,
                    Description = quest.Description,
                    ExternalId = quest.ExternalId,
                    ExternalUrl = quest.ExternalUrl,
                    Order = quest.OrderIndex,
                    Encounters = completedEncounters
                };
            }).ToList();

        return new RealmHistoryResponse
        {
            RealmCode = realm.Code,
            QuestHistories = questHistories
        };
    }
}
