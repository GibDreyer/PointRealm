import { useState } from "react";
import { api } from "@/api/client";
import { RealmRealtimeClient } from "@/realtime/realmClient";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { PageShell } from "@/components/shell/PageShell";
import { Panel } from "@/components/ui/Panel";
import { PageHeader } from "@/components/ui/PageHeader";
import { generateRandomRealmName, generateRandomQuestName, generateBotName } from "@/lib/realmNames";
import { ThemePicker } from "@/features/createRealm/components/ThemePicker";
import { useTheme } from "@/theme/ThemeProvider";
import { getClientId } from "@/lib/storage";
import type { RealmStateDto } from "@/types/realm";

const getErrorMessage = (error: unknown) => {
    if (!error || typeof error !== "object") return "Unknown error";
    const maybeError = error as { message?: string };
    return maybeError.message || "Unknown error";
};

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
    const { setThemeKey } = useTheme();

    // Realm Settings
    const [themeKey, setLocalThemeKey] = useState("dark-fantasy-arcane");
    const [deckType, setDeckType] = useState<string>("FIBONACCI");
    const [autoReveal, setAutoReveal] = useState(true);
    const [allowAbstain, setAllowAbstain] = useState(true);
    const [hideVoteCounts, setHideVoteCounts] = useState(false);

    // Bot Config
    const [botOptionsInput, setBotOptionsInput] = useState("");
    const [minDelay, setMinDelay] = useState(1);
    const [maxDelay, setMaxDelay] = useState(5);

    // Helper to log status with timestamp
    const log = (msg: string) => setStatus(prev => [`[${new Date().toLocaleTimeString().split(' ')[0]}] ${msg}`, ...prev]);

    const runTest = async () => {
        setIsRunning(true);
        setStatus([]);
        setRealmCode(null);
        const bots: RealmRealtimeClient[] = [];
        let mainClient: RealmRealtimeClient | null = null;

        try {
            // 1. Create Realm
            log("Creating Realm...");
            
            const DECKS = {
                FIBONACCI: ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "?"],
                SHORT_FIBONACCI: ["0", "0.5", "1", "2", "3", "5", "8", "13", "20", "40", "100", "?"],
                TSHIRT: ["XS", "S", "M", "L", "XL", "XXL", "?"],
            };

            const createPayload = {
                realmName: "Stress Test " + generateRandomRealmName(),
                themeKey: themeKey,
                settings: {
                    deckType: deckType,
                    autoReveal: autoReveal,
                    allowAbstain: allowAbstain,
                    hideVoteCounts: hideVoteCounts
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
            let latestState: RealmStateDto | null = null;
            const handleStateUpdate = (state: RealmStateDto) => { latestState = state; };

            const gmClientId = getClientId();
            mainClient = new RealmRealtimeClient({ clientId: gmClientId });
            const unsubscribeState = mainClient.on('realmStateUpdated', handleStateUpdate);

            await mainClient.connect({ realmCode: code, memberToken: gmJoin.memberToken, clientId: gmClientId });
            
            // Wait a moment for join to settle
            await new Promise(r => setTimeout(r, 500));

            // 3. Create Quest & Start Encounter
            log("Adding Quest...");
            const questName = generateRandomQuestName();
            if (!latestState?.questLogVersion) {
                throw new Error("Missing quest log version.");
            }
            const addQuestResult = await mainClient.addQuest({
                title: questName,
                description: "Testing load with " + botCount + " bots.",
                questLogVersion: latestState.questLogVersion,
            });
            let questId = addQuestResult?.payload;
            
            // Fallback: If AddQuest returned null, check the state
            if (!questId) {
                log("AddQuest returned null, checking state...");
                // Wait for state update if needed
                if (!latestState) await new Promise(r => setTimeout(r, 1000));
                
                const quests = latestState?.questLog?.quests || [];
                const found = quests.find((q) => q.title === questName);
                if (found) questId = found.id;
            }

            if (!questId) {
                throw new Error("Failed to create quest or retrieve ID.");
            }

            log(`Quest added: ${questId}. Starting encounter...`);
            const questVersion = (latestState?.questLog?.quests || []).find((q) => q.id === questId)?.version;
            if (!latestState?.realmVersion || !questVersion) {
                throw new Error("Missing realm or quest version.");
            }
            await mainClient.startEncounter({
                questId,
                realmVersion: latestState.realmVersion,
                questVersion,
            });
            log("Encounter Started.");

            // 4. Create Bots
            log(`Spawning ${botCount} bots...`);
            for (let i = 0; i < botCount; i++) {
                const botName = generateBotName();
                const botClientId = `bot-${i}-${Date.now()}`;
                const botClient = new RealmRealtimeClient({ clientId: botClientId });
                
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
                const botJoin = await joinRes.json() as { memberToken: string };
                
                // Connect SignalR
                await botClient.connect({ realmCode: code, memberToken: botJoin.memberToken, clientId: botClientId });
                
                bots.push(botClient);
                log(`${botName} joined.`);
                
                await new Promise(r => setTimeout(r, 100)); 
            }

            log(`All ${botCount} bots joined. Initiating staggered voting sequence...`);

            // 5. Vote
            const availableDeck = DECKS[deckType as keyof typeof DECKS] || DECKS.FIBONACCI;
            let botDeck = botOptionsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
            if (botDeck.length === 0) {
                botDeck = availableDeck;
            }
            
            let votesCast = 0;
            await Promise.all(bots.map(async (bot) => {
                // Calculate individual delay
                const delayMs = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay) * 1000;
                await new Promise(r => setTimeout(r, delayMs));

                const val = botDeck[Math.floor(Math.random() * botDeck.length)];
                try {
                    const encounterVersion = latestState?.encounter?.version;
                    if (!encounterVersion) {
                        throw new Error("Missing encounter version.");
                    }
                    await bot.selectRune({
                        value: val,
                        encounterVersion,
                    });
                    votesCast++;
                    // log(`Bot voted ${val} after ${delayMs/1000}s`);
                } catch (error) {
                    console.error("Bot vote failed", error);
                }
            }));

            log(`${votesCast} bots voted! Verification complete.`);
            
            // Clean up listener
            unsubscribeState();

        } catch (err) {
            console.error(err);
            log(`ERROR: ${getErrorMessage(err)}`);
        } finally {
            await Promise.all(bots.map((bot) => bot.disconnect().catch(() => undefined)));
            if (mainClient) {
                await mainClient.disconnect().catch(() => undefined);
            }
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
                        {/* Configuration Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Realm Settings */}
                            <div className="space-y-4 bg-black/20 p-4 rounded-lg border border-white/10">
                                <h3 className="text-sm font-bold text-amber-500/80 uppercase tracking-widest border-b border-white/5 pb-2">Realm Settings</h3>
                                
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] uppercase tracking-wider text-white/40 ml-1">Deck Type</label>
                                        <div className="flex gap-1">
                                            {["FIBONACCI", "SHORT_FIBONACCI", "TSHIRT"].map(t => (
                                                <Button 
                                                    key={t}
                                                    variant={deckType === t ? "secondary" : "primary"}
                                                    className="text-[9px] flex-1 h-8 px-0"
                                                    onClick={() => setDeckType(t)}
                                                >
                                                    {t.replace("SHORT_", "S. ")}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div 
                                            onClick={() => setAutoReveal(!autoReveal)}
                                            className={`p-2 rounded border cursor-pointer transition-colors text-center ${autoReveal ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-black/40 border-white/5 text-white/40'}`}
                                        >
                                            <div className="text-[10px] font-bold">Auto</div>
                                            <div className="text-[8px] uppercase">Reveal</div>
                                        </div>
                                        <div 
                                            onClick={() => setAllowAbstain(!allowAbstain)}
                                            className={`p-2 rounded border cursor-pointer transition-colors text-center ${allowAbstain ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-black/40 border-white/5 text-white/40'}`}
                                        >
                                            <div className="text-[10px] font-bold">Allow</div>
                                            <div className="text-[8px] uppercase">Abstain</div>
                                        </div>
                                        <div 
                                            onClick={() => setHideVoteCounts(!hideVoteCounts)}
                                            className={`p-2 rounded border cursor-pointer transition-colors text-center ${hideVoteCounts ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-black/40 border-white/5 text-white/40'}`}
                                        >
                                            <div className="text-[10px] font-bold">Hide</div>
                                            <div className="text-[8px] uppercase">Counts</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Atmosphere / Theme */}
                            <div className="space-y-4 bg-black/20 p-4 rounded-lg border border-white/10">
                                <h3 className="text-sm font-bold text-purple-500/80 uppercase tracking-widest border-b border-white/5 pb-2">Atmosphere</h3>
                                <ThemePicker 
                                    selectedThemeKey={themeKey} 
                                    onThemeSelect={(key) => {
                                        setLocalThemeKey(key);
                                        setThemeKey(key);
                                    }} 
                                />
                            </div>

                            {/* Bot Config */}
                            <div className="space-y-4 bg-black/20 p-4 rounded-lg border border-white/10">
                                <h3 className="text-sm font-bold text-blue-500/80 uppercase tracking-widest border-b border-white/5 pb-2">Bot Rituals</h3>
                                
                                <div className="space-y-4">
                                    <Input 
                                        label="Bot Count" 
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={botCount} 
                                        onChange={(e) => setBotCount(parseInt(e.target.value) || 0)}
                                        disabled={isRunning}
                                        className="bg-black/40 h-9"
                                    />

                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <Input 
                                                label="Min Delay (s)" 
                                                type="number"
                                                min={0}
                                                value={minDelay} 
                                                onChange={(e) => setMinDelay(parseInt(e.target.value) || 0)}
                                                disabled={isRunning}
                                                className="bg-black/40 h-9"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Input 
                                                label="Max Delay (s)" 
                                                type="number"
                                                min={0}
                                                value={maxDelay} 
                                                onChange={(e) => setMaxDelay(parseInt(e.target.value) || 0)}
                                                disabled={isRunning}
                                                className="bg-black/40 h-9"
                                            />
                                        </div>
                                    </div>

                                    <Input 
                                        label="Bot Vote Options (comma separated)" 
                                        placeholder="e.g. 1, 2, 3, 5, ?"
                                        value={botOptionsInput} 
                                        onChange={(e) => setBotOptionsInput(e.target.value)}
                                        disabled={isRunning}
                                        className="bg-black/40 h-9"
                                        helper="Leave empty for full deck"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <Button 
                                onClick={runTest} 
                                disabled={isRunning || botCount < 1} 
                                variant="primary"
                                className="h-12 flex-1 tracking-[0.2em] uppercase font-bold"
                            >
                                {isRunning ? "Sequencing..." : "Initiate Test Sequence"}
                            </Button>
                        </div>

                        {realmCode && (
                            <div className="flex justify-between items-center p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                                <div>
                                    <span className="text-emerald-400 font-bold block text-sm mb-1 uppercase tracking-tighter">Active Realm</span>
                                    <span className="text-2xl font-mono text-white tracking-[0.3em]">{realmCode}</span>
                                </div>
                                <Button 
                                    onClick={() => window.open(`/realm/${realmCode}`, '_blank')}
                                    variant="secondary"
                                    className="h-10 text-xs px-6"
                                >
                                    Enter Realm
                                </Button>
                            </div>
                        )}

                        <div className="bg-black/60 border border-white/10 rounded-lg h-64 overflow-y-auto p-4 font-mono text-[10px] text-green-400/80 shadow-inner">
                            {status.length === 0 && <span className="text-white/20 italic">Waiting for command...</span>}
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
