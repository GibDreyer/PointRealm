import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Panel } from '../../../components/ui/Panel';
import { Button } from '../../../components/Button';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { useToast } from '../../../components/ui/ToastSystem';
import { cn } from '../../../lib/utils';
import styles from './RealmPortalCard.module.css';

interface Props {
    joinUrl: string;
    className?: string;
}

export function RealmPortalCard({ joinUrl, className }: Props) {
    const { toast } = useToast();
    const [ripple, setRipple] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(joinUrl);
            triggerRipple();
            toast('Portal copied', 'success');
        } catch (err) {
            console.error('Failed to copy', err);
            toast('Copy failed', 'error');
        }
    };

    const triggerRipple = () => {
        setRipple(false);
        setTimeout(() => setRipple(true), 10);
    };

    return (
        <Panel className={cn("relative overflow-hidden", className)}>
            <SectionHeader 
                title="Realm Portal" 
                subtitle="Invite Link" 
                className="mb-4"
            />

            <div className="flex flex-col gap-3">
                <div className="relative group">
                    <input 
                        readOnly
                        value={joinUrl}
                        className={cn(
                            "w-full h-11 px-4 rounded-[var(--pr-radius-md)] text-xs font-mono outline-none truncate",
                            styles.portalInput
                        )}
                        onClick={(e) => e.currentTarget.select()}
                    />
                </div>
                
                <Button
                    onClick={handleCopy}
                    variant="primary"
                    className="h-11 relative overflow-hidden shadow-none"
                    fullWidth
                >
                    <Copy size={16} className="mr-2" />
                    Copy
                    <span className={cn(styles.ripple, ripple && styles.rippleActive)} />
                </Button>
            </div>
        </Panel>
    );
}
