import { Encounter, Quest, RealmSettings, RealmStateDto } from '../../../types/realm';
import { cn } from '../../../lib/utils';
import { ProphecyReveal } from '../../reveal/ProphecyReveal';
import { RuneCard } from './RuneCard';
import { motion } from 'framer-motion';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Panel } from '../../../components/ui/Panel';
import styles from './EncounterPanel.module.css';

interface EncounterPanelProps {
    quest: Quest | null;
    encounter: Encounter | null;
    settings: RealmSettings;
    partyRoster: RealmStateDto['partyRoster']; 
    isGM: boolean;
    canVote: boolean;
    myVote?: string | null;
    onVote: (value: string) => void;
    onReroll: () => void;
    onReveal: () => void;
    onStartEncounter: (questId: string) => void;
    onSealOutcome: (value: string) => Promise<void>;
}

export function EncounterPanel({ quest, encounter, settings, partyRoster, isGM, canVote, myVote, onVote, onReroll, onReveal, onStartEncounter, onSealOutcome }: EncounterPanelProps) {
    if (!quest) {
        return (
            <div className={styles.noQuest}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full"
                >
                    <Panel variant="realm" className="py-14 px-10 border-pr-border/30 text-center">
                        <SectionHeader
                            title="Quiet Realm"
                            subtitle={isGM ? "Select a quest from the log to begin an encounter." : "Wait for the Game Master to initiate the ordeal."}
                        />
                    </Panel>
                </motion.div>
            </div>
        );
    }

    const getDeckValues = (s: RealmSettings) => {
        if (s.deckType === 'FIBONACCI') return ['1', '2', '3', '5', '8', '13', '21', '?', 'coffee'];
        if (s.deckType === 'TSHIRT') return ['XS', 'S', 'M', 'L', 'XL', '?', 'coffee'];
        if (s.deckType === 'CUSTOM' && s.customDeckValues) return s.customDeckValues;
        return ['1', '2', '3', '5', '8', '13', '?', 'coffee'];
    };
    const deckValues = getDeckValues(settings);

    const visibleMembers = partyRoster.members.slice(0, 12);
    const seatCount = Math.max(3, visibleMembers.length);
    const hasVotes = partyRoster.members.some((member) => member.status === 'ready');
    const readyCount = partyRoster.members.filter((member) => member.status === 'ready').length;
    const rerollDisabled = !hasVotes || !!encounter?.isRevealed;
    const revealDisabled = !hasVotes || !!encounter?.isRevealed;

    return (
        <div className={styles.wrapper}>
            {!encounter?.isRevealed && (
                <motion.header
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className={styles.header}
                >
                    <span className={styles.headerLabel}>Active Quest</span>
                    <h1 className={styles.headerTitle}>{quest.title}</h1>
                    {quest.description && (
                        <p className={styles.headerSubtitle}>{quest.description}</p>
                    )}
                </motion.header>
            )}

            <div className={styles.tableArea}>
                {encounter?.isRevealed ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        className="w-full"
                    >
                        <ProphecyReveal
                            encounter={encounter}
                            partyRoster={partyRoster.members}
                            isGM={isGM}
                            deckValues={deckValues}
                            quest={quest}
                            onSealOutcome={onSealOutcome}
                            onReroll={onReroll}
                            hideVoteCounts={encounter.shouldHideVoteCounts ?? settings.hideVoteCounts}
                        />
                    </motion.div>
                ) : (
                    <div className={styles.tableWrap}>
                        <div className={styles.tableSurface}>
                            <div className={styles.tableRuneRing} />
                            <div className={styles.tableGlow} />
                            {isGM && (
                                <div className={styles.centerCluster}>
                                    {encounter ? (
                                        <>
                                            <motion.button
                                                type="button"
                                                whileHover={!rerollDisabled ? { y: -2 } : {}}
                                                whileTap={!rerollDisabled ? { scale: 0.98 } : {}}
                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                onClick={onReroll}
                                                disabled={rerollDisabled}
                                                className={styles.rerollButton}
                                            >
                                                Re-roll the Fates
                                            </motion.button>
                                            <span className={styles.rerollSubtitle}>Clear votes and revote</span>
                                            <motion.button
                                                type="button"
                                                whileHover={!revealDisabled ? { y: -2 } : {}}
                                                whileTap={!revealDisabled ? { scale: 0.98 } : {}}
                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                onClick={onReveal}
                                                disabled={revealDisabled}
                                                className={styles.revealButton}
                                            >
                                                Reveal Prophecy
                                            </motion.button>
                                            <span className={styles.revealSubtitle}>
                                                {settings.hideVoteCounts ? 'Votes are hidden' : `${readyCount} ready`}
                                            </span>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => onStartEncounter(quest.id)}
                                                className={cn(styles.revealButton, "!bg-pr-primary !text-pr-bg px-8")}
                                            >
                                                Begin Quest
                                            </motion.button>
                                            <span className={styles.revealSubtitle}>Commence the ritual</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={styles.seats} style={{ ['--count' as string]: seatCount }}>
                            {visibleMembers.map((member, index) => {
                                const hasVoted = member.status === 'ready';
                                const isDisconnected = !member.isOnline || member.status === 'disconnected';
                                const initials = member.name.trim().slice(0, 2);
                                return (
                                    <div
                                        key={member.id}
                                        className={styles.seat}
                                        style={{ ['--index' as string]: index } as React.CSSProperties}
                                    >
                                        <div
                                            className={cn(
                                                styles.seatBadge,
                                                hasVoted && styles.seatVoted,
                                                isDisconnected && styles.seatDisconnected
                                            )}
                                        >
                                            {initials}
                                        </div>
                                        <div className={styles.seatName}>{member.name}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {!encounter?.isRevealed && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className={styles.voteTray}
                >
                    <div className={styles.voteHeader}>
                        <SectionHeader title="Cast Your Rune" subtitle="Make your estimation" className="mb-0" />
                    </div>
                    <div className={styles.voteScroller}>
                        {deckValues.map((val: string) => (
                            <RuneCard
                                key={val}
                                value={val}
                                isSelected={myVote === val}
                                disabled={!canVote}
                                onClick={() => onVote(val)}
                                className={styles.voteCard || ""}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
