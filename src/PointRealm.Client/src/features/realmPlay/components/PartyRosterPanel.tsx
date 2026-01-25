import { AnimatePresence } from 'framer-motion';
import { PartyMember } from '../../../types/realm';
import { RealmPortalCard } from '../../realmLobby/components/RealmPortalCard';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { MemberCard } from './MemberCard';

interface PartyRosterPanelProps {
    members: PartyMember[];
    currentMemberId: string;
    hideVoteCounts: boolean;
    encounterStatus?: 'idle' | 'voting' | 'revealed' | 'sealed';
}

export function PartyRosterPanel({ 
    members, 
    currentMemberId, 
    hideVoteCounts, 
    encounterStatus 
}: PartyRosterPanelProps) {
    const sortedMembers = [...members].sort((a, b) => {
        if (a.role === 'GM' && b.role !== 'GM') return -1;
        if (a.role !== 'GM' && b.role === 'GM') return 1;
        if (a.id === currentMemberId) return -1;
        if (b.id === currentMemberId) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="flex flex-col h-full">
            <header className="p-5 border-b border-pr-border/20 bg-pr-surface/40">
                <SectionHeader
                    title="Party"
                    subtitle="Presence"
                    className="mb-0 [&_h2]:text-lg"
                />
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {sortedMembers.map(member => (
                        <MemberCard
                            key={member.id}
                            member={member}
                            isSelf={member.id === currentMemberId}
                        />
                    ))}
                </AnimatePresence>

                {encounterStatus === 'voting' && hideVoteCounts && (
                    <p className="text-[9px] uppercase tracking-[0.35em] text-pr-text-muted/60 text-center pt-2">
                        Votes hidden
                    </p>
                )}
            </div>

            <footer className="p-4 border-t border-pr-border/20 bg-pr-surface/40">
                <div className="rounded-lg overflow-hidden border border-pr-border/10">
                    <RealmPortalCard 
                        joinUrl={`${window.location.origin}/join?realmCode=${window.location.pathname.split('/')[2]}`}
                        className="!bg-transparent !shadow-none !border-none p-0 scale-90 -translate-y-1"
                    />
                </div>
            </footer>
        </div>
    );
}
