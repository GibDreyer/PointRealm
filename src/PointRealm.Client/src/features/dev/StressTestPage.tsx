import { useState } from "react";
import { api } from "@/api/client";
import { RealmHub, hub as mainHub } from "@/realtime/hub";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { PageShell } from "@/components/shell/PageShell";
import { Panel } from "@/components/ui/Panel";
import { PageHeader } from "@/components/ui/PageHeader";
import { generateRandomRealmName, generateRandomQuestName, generateBotName } from "@/lib/realmNames";

export function StressTestPage() {
    // Extra safety check in case route leaks
    if (!import.meta.env.DEV) {
        return (
             <PageShell>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="p-8 text-center text-red-500 bg-red-950/30 border border-red-500/50 rounded">
                        <h1 className="text-xl font-bold mb-2">Access Denied</h1>
                        <p>This tool is only available in development mode.</p>
                    </div>
                </div>
             </PageShell>
        );
    }

    const [botCount, setBotCount] = useState(5);
    const [status, setStatus] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [realmCode, setRealmCode] = useState<string | null>(null);

    // Helper to log status with timestamp
    const log = (msg: string) => setStatus(prev => [`[${new Date().toLocaleTimeString().split(' ')[0]}] ${msg}`, ...prev]);

    const runTest = async () => {
        setIsRunning(true);
        setStatus([]);
        setRealmCode(null);
        const bots: RealmHub[] = [];

        try {
            // 1. Create Realm
            log("Creating Realm...");
            const createPayload = {
                realmName: "Stress Test " + generateRandomRealmName(),
                themeKey: "dark-fantasy-arcane",
                settings: {
                    deckType: "FIBONACCI",
                    autoReveal: true,
                    allowAbstain: true,
                    hideVoteCounts: false
                }
            };
            const { code } = await api.post<{ code: string }>("realms", createPayload);
            setRealmCode(code);
            log(`Realm created: ${code}`);

            // 2. Join as GM (Client)
            log("Joining as GM (Observer)...");
            const gmPayload = { displayName: "StressTest GM", role: "GM" };
            const gmJoin = await api.post<{ memberToken: string, memberId: string }>(`realms/${code}/join`, gmPayload);
            
            sessionStorage.setItem(`pointrealm:v1:realm:${code}:token`, gmJoin.memberToken);
            sessionStorage.setItem(`pointrealm:v1:realm:${code}:memberId`, gmJoin.memberId);

            // Setup state listener to catch updates
            let latestState: any = null;
            const handleStateUpdate = (state: any) => { latestState = state; };
            mainHub.on('RealmStateUpdated', handleStateUpdate);

            await mainHub.connect(gmJoin.memberToken);
            await mainHub.invoke("JoinRealm", code);
            
            // Wait a moment for join to settle
            await new Promise(r => setTimeout(r, 500));

            // 3. Create Quest & Start Encounter
            log("Adding Quest...");
            const questName = generateRandomQuestName();
            let questId = await mainHub.invoke<string>("AddQuest", questName, "Testing load with " + botCount + " bots.");
            
            // Fallback: If AddQuest returned null, check the state
            if (!questId) {
                log("AddQuest returned null, checking state...");
                // Wait for state update if needed
                if (!latestState) await new Promise(r => setTimeout(r, 1000));
                
                const quests = latestState?.questLog?.quests || [];
                const found = quests.find((q: any) => q.title === questName);
                if (found) questId = found.id;
            }

            if (!questId) {
                throw new Error("Failed to create quest or retrieve ID.");
            }

            log(`Quest added: ${questId}. Starting encounter...`);
            await mainHub.invoke("StartEncounter", questId);
            log("Encounter Started.");

            // 4. Create Bots
            log(`Spawning ${botCount} bots...`);
            for (let i = 0; i < botCount; i++) {
                const botName = generateBotName();
                const botClientId = `bot-${i}-${Date.now()}`;
                const botHub = new RealmHub();
                
                // Join API - Use fetch directly to avoid picking up the GM's auth token
                const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
                const joinRes = await fetch(`${apiBase}/realms/${code}/join`, {
                    method: 'POST',
                    credentials: 'omit',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-PointRealm-ClientId': botClientId
                    },
                    body: JSON.stringify({
                        displayName: botName,
                        role: "Member"
                    })
                });
                
                if (!joinRes.ok) throw new Error(`Bot ${botName} failed to join`);
                const botJoin = await joinRes.json();
                
                // Connect SignalR
                await botHub.connect(botJoin.memberToken, botClientId);
                await botHub.invoke("JoinRealm", code);
                
                bots.push(botHub);
                log(`${botName} joined.`);
                
                await new Promise(r => setTimeout(r, 150)); 
            }

            log(`All ${botCount} bots joined. Waiting 2 seconds before voting...`);
            await new Promise(r => setTimeout(r, 2000));

            // 5. Vote
            log("Bots voting...");
            const deck = ["1", "2", "3", "5", "8", "13", "21", "?"];
            
            let votesCast = 0;
            await Promise.all(bots.map(async (bot, idx) => {
                const val = deck[idx % deck.length];
                try {
                    await bot.invoke("SelectRune", val);
                    votesCast++;
                } catch (e) {
                    console.error("Bot vote failed", e);
                }
            }));

            log(`${votesCast} bots voted! Verification complete.`);
            
            // Clean up listener
            mainHub.off('RealmStateUpdated', handleStateUpdate);

        } catch (err: any) {
            console.error(err);
            log(`ERROR: ${err.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <PageShell backgroundVariant="realm">
            <div className="w-full flex justify-center z-10 pt-12">
                <Panel variant="realm" className="w-[100%] max-w-[800px]">
                    <PageHeader
                        title="Realm Stress Test"
                        subtitle="Summon echoes to test the fabric of reality"
                        size="panel"
                    />

                    <div className="space-y-6">
                        <div className="flex gap-4 items-end bg-black/20 p-4 rounded-lg border border-white/10">
                            <div className="flex-1">
                                <Input 
                                    label="Number of Echoes (Bots)" 
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={botCount} 
                                    onChange={(e) => setBotCount(parseInt(e.target.value) || 0)}
                                    disabled={isRunning}
                                    className="bg-black/40"
                                />
                            </div>
                            <Button 
                                onClick={runTest} 
                                disabled={isRunning || botCount < 1} 
                                variant="primary"
                                className="h-[42px] mb-[2px]"
                            >
                                {isRunning ? "Summoning..." : "Start Sequence"}
                            </Button>
                        </div>

                        {realmCode && (
                            <div className="flex justify-between items-center p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                                <div>
                                    <span className="text-emerald-400 font-bold block text-sm mb-1">Active Realm</span>
                                    <span className="text-xl font-mono text-white tracking-widest">{realmCode}</span>
                                </div>
                                <Button 
                                    onClick={() => window.open(`/realm/${realmCode}`, '_blank')}
                                    variant="secondary"
                                    className="h-10 text-xs"
                                >
                                    Open In New Tab
                                </Button>
                            </div>
                        )}

                        <div className="bg-black/60 border border-white/10 rounded-lg h-96 overflow-y-auto p-4 font-mono text-xs text-green-400/80 shadow-inner">
                            {status.length === 0 && <span className="text-white/20 italic">Waiting to begin...</span>}
                            {status.map((line, i) => (
                                <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">{line}</div>
                            ))}
                        </div>
                    </div>
                </Panel>
            </div>
        </PageShell>
    );
}
