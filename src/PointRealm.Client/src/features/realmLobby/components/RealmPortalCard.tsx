import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCircle2, XCircle, Link as LinkIcon } from 'lucide-react';
import { Panel } from '../../../components/ui/Panel';
import { Button } from '../../../components/Button';
import { SectionHeader } from '../../../components/ui/SectionHeader';

interface Props {
    joinUrl: string;
}

export function RealmPortalCard({ joinUrl }: Props) {
    const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');
    const [ripple, setRipple] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(joinUrl);
            setCopyState('success');
            triggerRipple();
            setTimeout(() => setCopyState('idle'), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
            setCopyState('error');
            setTimeout(() => setCopyState('idle'), 3000);
        }
    };

    const triggerRipple = () => {
        setRipple(false);
        setTimeout(() => setRipple(true), 10);
    };

    return (
        <Panel className="relative overflow-hidden">
            {/* Ambient Pulse in background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-pr-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <SectionHeader 
                title="Realm Portal" 
                subtitle="Invite your party members" 
                className="mb-4"
            />

            <div className="flex flex-col gap-3">
                <div className="relative group">
                    <input 
                        readOnly
                        value={joinUrl}
                        className="w-full h-11 pl-4 pr-10 rounded-[var(--pr-radius-md)] bg-pr-bg border border-pr-border text-pr-text text-xs font-mono focus:border-pr-primary/50 outline-none truncate transition-colors"
                        onClick={(e) => e.currentTarget.select()}
                    />
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-pr-bg to-transparent pointer-events-none rounded-r-[var(--pr-radius-md)]" />
                    <LinkIcon size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-pr-text-muted/30 group-hover:text-pr-primary/50 transition-colors" />
                </div>
                
                <Button
                    onClick={handleCopy}
                    variant="secondary"
                    className="h-11 relative overflow-hidden"
                    fullWidth
                >
                    <AnimatePresence mode='wait'>
                        {copyState === 'success' ? (
                            <motion.div
                                key="check"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <CheckCircle2 size={16} className="text-pr-success" />
                                <span>Link Captured</span>
                            </motion.div>
                        ) : copyState === 'error' ? (
                            <motion.div
                                key="error"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <XCircle size={16} className="text-pr-danger" />
                                <span>Magic Failed</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="copy"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <Copy size={16} />
                                <span>Copy Join Link</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {ripple && (
                        <span className="absolute inset-0 bg-pr-primary/10 animate-ping-slow pointer-events-none" />
                    )}
                </Button>
            </div>

            {/* In-place Toast/Feedback Message just below */}
            <div className="h-4 mt-2 relative">
                <AnimatePresence>
                    {copyState === 'success' && (
                        <motion.p
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] text-pr-success/80 font-bold uppercase tracking-tighter absolute left-0"
                        >
                            Portal link copied to your satchel.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </Panel>
    );
}
