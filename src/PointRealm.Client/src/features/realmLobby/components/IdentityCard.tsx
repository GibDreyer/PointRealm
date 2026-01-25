import { User, Edit2 } from 'lucide-react';
import { Panel } from '../../../components/ui/Panel';
import { SectionHeader } from '../../../components/ui/SectionHeader';

interface Props {
    currentName: string;
}

export function IdentityCard({ currentName }: Props) {
    return (
        <Panel variant="default" className="border-pr-border/40">
            <SectionHeader 
                title="Your Identity" 
                subtitle="How the realm sees you" 
                className="mb-4"
            />
            
            <div className="flex items-center gap-4 p-3 rounded-lg bg-pr-bg/40 border border-pr-border/20">
                <div className="w-12 h-12 rounded-full bg-pr-primary/10 border border-pr-primary/20 flex items-center justify-center text-pr-primary">
                    <User size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-pr-text-muted uppercase font-black tracking-widest mb-0.5">Adventurer Name</p>
                    <p className="text-lg font-bold text-pr-text truncate">{currentName}</p>
                </div>
                <button 
                    disabled
                    className="p-2 text-pr-text-muted opacity-30 cursor-not-allowed"
                    title="Change Name (Coming soon)"
                >
                    <Edit2 size={16} />
                </button>
            </div>
        </Panel>
    );
}
