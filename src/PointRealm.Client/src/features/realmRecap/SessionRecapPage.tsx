import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Upload, Copy, Sparkles, ArrowLeft } from "lucide-react";

import { realmRecapApi } from "@/api/realmRecap";
import { PageShell } from "@/components/shell/PageShell";
import { Button } from "@/components/Button";
import { ApiError } from "@/api/client";

import styles from "./SessionRecapPage.module.css";

type TimelineEncounter = {
  questTitle: string;
  completedAt: string;
  sealedOutcome: number | null;
  spread: number;
  totalVotes: number;
  consensusPercent: number;
};

const computeSpread = (distribution: Record<string, number>) => {
  const values = Object.entries(distribution)
    .filter(([, count]) => count > 0)
    .map(([vote]) => Number(vote))
    .filter((vote) => Number.isFinite(vote));

  if (values.length <= 1) return 0;
  return Math.max(...values) - Math.min(...values);
};

const computeConsensusPercent = (distribution: Record<string, number>) => {
  const counts = Object.values(distribution);
  const total = counts.reduce((acc, current) => acc + current, 0);
  if (total === 0) return 0;
  const maxCount = Math.max(...counts);
  return Math.round((maxCount / total) * 100);
};

export function SessionRecapPage() {
  const { code } = useParams<{ code: string }>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["realm-history", code],
    queryFn: () => realmRecapApi.getRealmHistory(code ?? ""),
    enabled: Boolean(code),
  });

  const timeline = useMemo<TimelineEncounter[]>(() => {
    if (!data) return [];

    return data.questHistories
      .flatMap((quest) =>
        quest.encounters.map((encounter) => ({
          questTitle: quest.title,
          completedAt: encounter.completedAt,
          sealedOutcome: encounter.sealedOutcome,
          spread: computeSpread(encounter.distribution),
          totalVotes: encounter.votes.length,
          consensusPercent: computeConsensusPercent(encounter.distribution),
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
  }, [data]);

  const stats = useMemo(() => {
    const totalEncounters = timeline.length;
    const averageSpread =
      totalEncounters === 0
        ? 0
        : timeline.reduce((sum, item) => sum + item.spread, 0) / totalEncounters;
    const highestSpread =
      timeline.length === 0
        ? null
        : timeline.reduce((currentMax, item) =>
            item.spread > currentMax.spread ? item : currentMax
          );
    const strongestConsensus =
      timeline.length === 0
        ? null
        : timeline.reduce((currentMax, item) =>
            item.consensusPercent > currentMax.consensusPercent ? item : currentMax
          );

    return {
      totalEncounters,
      completedQuests: data?.questHistories.filter((quest) => quest.encounters.length > 0)
        .length ?? 0,
      averageSpread,
      highestSpread,
      strongestConsensus,
    };
  }, [data, timeline]);

  const questTrends = useMemo(() => {
    if (!data) return [];

    return data.questHistories
      .map((quest) => {
        const spreads = quest.encounters.map((encounter) =>
          computeSpread(encounter.distribution)
        );
        const avgSpread =
          spreads.length === 0
            ? 0
            : spreads.reduce((acc, value) => acc + value, 0) / spreads.length;

        return {
          questId: quest.questId,
          title: quest.title,
          encounters: quest.encounters.length,
          avgSpread,
        };
      })
      .sort((a, b) => b.encounters - a.encounters || b.avgSpread - a.avgSpread);
  }, [data]);

  const summaryText = useMemo(() => {
    if (!data) return "";

    const lines = [
      `Session Recap for Realm ${data.realmCode}`,
      `Completed encounters: ${stats.totalEncounters}`,
      `Completed quests: ${stats.completedQuests}`,
      `Average spread: ${stats.averageSpread.toFixed(2)}`,
    ];

    if (stats.highestSpread) {
      lines.push(
        `Highest spread quest: ${stats.highestSpread.questTitle} (spread ${stats.highestSpread.spread})`
      );
    }

    if (stats.strongestConsensus) {
      lines.push(
        `Strongest consensus: ${stats.strongestConsensus.questTitle} (${stats.strongestConsensus.consensusPercent}% agreement)`
      );
    }

    return lines.join("\n");
  }, [data, stats]);

  const copySummary = async () => {
    if (!summaryText) return;
    await navigator.clipboard.writeText(summaryText);
    setStatusMessage("Summary copied to clipboard.");
  };

  const downloadCsv = async () => {
    if (!code) return;
    try {
      setIsExporting(true);
      setStatusMessage(null);
      const csvBlob = await realmRecapApi.exportQuestsCsv(code);
      const url = URL.createObjectURL(csvBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${code}-quests.csv`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatusMessage("CSV export generated.");
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to export CSV right now.";
      setStatusMessage(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!code) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setStatusMessage(null);
      const result = await realmRecapApi.importQuestsCsv(code, file);
      setStatusMessage(
        `Import complete: ${result.successCount} succeeded, ${result.errorCount} failed.`
      );
      await refetch();
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to import CSV right now.";
      setStatusMessage(message);
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className={styles.page}>Loading session recap...</div>
      </PageShell>
    );
  }

  if (error || !data) {
    return (
      <PageShell>
        <div className={styles.page}>
          <h1 className="text-2xl font-black">Session Recap</h1>
          <p className="text-pr-text-muted">Unable to load history for this realm.</p>
          <Link to={`/realm/${code}`} className="underline underline-offset-4">
            Return to active realm
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className={styles.page}>
        <section className={styles.headerRow}>
          <div>
            <h1 className="text-3xl font-black">Session Recap</h1>
            <p className="text-pr-text-muted">
              Timeline, consensus, spread trends, and export/share tools for realm {data.realmCode}.
            </p>
          </div>

          <div className={styles.actions}>
            <Link to={`/realm/${code}`}>
              <Button variant="secondary">
                <ArrowLeft size={16} />
                Back to realm
              </Button>
            </Link>
            <Button variant="secondary" onClick={copySummary}>
              <Copy size={16} />
              Copy summary
            </Button>
            <Button variant="secondary" onClick={downloadCsv} disabled={isExporting}>
              <Download size={16} />
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
            <Button
              variant="secondary"
             
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <Upload size={16} />
              {isImporting ? "Importing..." : "Import CSV"}
            </Button>
            <input
              ref={fileInputRef}
              className={styles.fileInput}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportCsv}
            />
          </div>
        </section>

        {statusMessage && (
          <p className="text-sm text-pr-text-muted" role="status">
            {statusMessage}
          </p>
        )}

        <section className={styles.statGrid}>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Completed encounters</p>
            <p className={styles.statValue}>{stats.totalEncounters}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Completed quests</p>
            <p className={styles.statValue}>{stats.completedQuests}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Average spread</p>
            <p className={styles.statValue}>{stats.averageSpread.toFixed(2)}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Strongest consensus</p>
            <p className={styles.statValue}>{stats.strongestConsensus?.consensusPercent ?? 0}%</p>
          </article>
        </section>

        <section className={styles.statCard}>
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Sparkles size={16} /> MVP Insight Moments
          </h2>
          <ul className="grid gap-1 text-sm">
            <li>
              Highest spread quest: {stats.highestSpread?.questTitle ?? "N/A"} (spread {stats.highestSpread?.spread ?? 0})
            </li>
            <li>
              Most aligned quest: {stats.strongestConsensus?.questTitle ?? "N/A"} ({stats.strongestConsensus?.consensusPercent ?? 0}% consensus)
            </li>
          </ul>
        </section>

        <section className={styles.statCard}>
          <h2 className="text-lg font-bold mb-3">Consensus & Spread Trends</h2>
          <div className={styles.trendRow}>
            {questTrends.map((trend) => (
              <div key={trend.questId}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-semibold">{trend.title}</span>
                  <span className="text-pr-text-muted">
                    {trend.encounters} encounters · avg spread {trend.avgSpread.toFixed(2)}
                  </span>
                </div>
                <div className={styles.bar} style={{ width: `${Math.min(100, trend.avgSpread * 20 + 15)}%` }} />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.statCard}>
          <h2 className="text-lg font-bold mb-3">Completed Quest Timeline</h2>
          <div className={styles.timeline}>
            {timeline.map((item, index) => (
              <article className={styles.timelineItem} key={`${item.questTitle}-${item.completedAt}-${index}`}>
                <h3 className="font-bold">{item.questTitle}</h3>
                <p className="text-sm text-pr-text-muted">
                  {new Date(item.completedAt).toLocaleString()}
                </p>
                <div>
                  <span className={styles.pill}>Spread: {item.spread}</span>
                  <span className={styles.pill}>Consensus: {item.consensusPercent}%</span>
                  <span className={styles.pill}>Votes: {item.totalVotes}</span>
                  <span className={styles.pill}>Sealed: {item.sealedOutcome ?? "—"}</span>
                </div>
              </article>
            ))}
            {timeline.length === 0 && (
              <p className="text-pr-text-muted text-sm">No completed encounters yet.</p>
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
