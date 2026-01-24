import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, Dice5, Eye, EyeOff, UserX } from "lucide-react";

import { useTheme } from "../../theme/ThemeProvider";
import { RealmBackground } from "../../components/ui/RealmBackground";
import { ThemePreview } from "./components/ThemePreview";
import { ThemePicker } from "./components/ThemePicker";
import { api } from "../../api/client";
import { hub } from "../../realtime/hub";
import { updateProfile, getProfile, STORAGE_KEYS } from "../../lib/storage";

// --- Schema ---

const DeckTypeEnum = z.enum(["FIBONACCI", "SHORT_FIBONACCI", "TSHIRT", "CUSTOM"]);

const formSchema = z.object({
  realmName: z.string().max(60).optional(),
  displayName: z.string().min(1, "Display name is required").max(32).trim(),
  themeKey: z.string(),
  deckType: DeckTypeEnum,
  customDeckValuesInput: z.string().optional(),
  autoReveal: z.boolean(),
  allowAbstain: z.boolean(),
  hideVoteCounts: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.deckType === "CUSTOM") {
    if (!data.customDeckValuesInput || data.customDeckValuesInput.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customDeckValuesInput"],
        message: "Custom values are required",
      });
      return;
    }
    
    const values = data.customDeckValuesInput.split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);
      
    // Unique
    const uniqueValues = Array.from(new Set(values));
    
    if (uniqueValues.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customDeckValuesInput"],
        message: "Must provide at least 3 unique values",
      });
    }
    
    if (uniqueValues.length > 24) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["customDeckValuesInput"],
            message: "Max 24 values allowed",
        });
    }
  }
});

type FormData = z.infer<typeof formSchema>;

// --- Helper Functions ---

const parseCustomDeck = (input: string): string[] => {
    return Array.from(new Set(
        input.split(",").map(s => s.trim()).filter(s => s.length > 0)
    ));
}

// --- Component ---

export function CreateRealmPage() {
  const navigate = useNavigate();
  const { availableThemes, setThemeKey } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Initial display name from storage
  const initialDisplayName = localStorage.getItem(STORAGE_KEYS.DISPLAY_NAME) || getProfile().lastDisplayName || "";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      realmName: "",
      displayName: initialDisplayName,
      themeKey: "dark-fantasy-arcane",
      deckType: "FIBONACCI",
      customDeckValuesInput: "",
      autoReveal: true,
      allowAbstain: true,
      hideVoteCounts: false,
    },
  });

  const { watch, handleSubmit, control, setValue, formState: { errors } } = form;
  
  // Update live preview when theme changes in form
  const selectedThemeKey = watch("themeKey");
  const selectedDeckType = watch("deckType");

  // Sync theme preview 
  // Note: We don't want to change the Global theme until creation, but the `ThemePicker` 
  // component (and `ThemePreview`) handle the visualization.
  // The `ThemePicker` *updates* variable `selectedThemeKey`.
  
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      // 1. Persist Display Name
      localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, data.displayName);
      updateProfile({ lastDisplayName: data.displayName });

      // 2. Prepare Payload
      let customDeckValues: string[] | undefined;
      
      if (data.deckType === "CUSTOM") {
        customDeckValues = parseCustomDeck(data.customDeckValuesInput!);
        
        // Auto-add '?' if allowAbstain and not present
        if (data.allowAbstain && !customDeckValues.includes("?")) {
            customDeckValues.push("?");
        }
      }

      // 3. Create Realm
      const createPayload = {
        realmName: data.realmName || undefined,
        themeKey: data.themeKey,
        settings: {
            deckType: data.deckType,
            customDeckValues: customDeckValues,
            autoReveal: data.autoReveal,
            allowAbstain: data.allowAbstain,
            hideVoteCounts: data.hideVoteCounts
        }
      };

      const realmResponse = await api.post<{ code: string }>("realms", createPayload);
      const realmCode = realmResponse.code;

      // 4. Join as GM
      const joinPayload = {
        displayName: data.displayName,
        role: "GM"
      };

      const joinResponse = await api.post<{ memberToken: string, memberId: string }>(`realms/${realmCode}/join`, joinPayload);

      // 5. Store Token
      // storing in sessionStorage for the session
      sessionStorage.setItem(`pointrealm:v1:realm:${realmCode}:token`, joinResponse.memberToken);
      sessionStorage.setItem(`pointrealm:v1:realm:${realmCode}:memberId`, joinResponse.memberId);

      // 6. Connect SignalR
      await hub.start();
      
      // 7. Navigate
      // Set global theme to match created realm before navigating for smoothness
      setThemeKey(data.themeKey);
      
      navigate(`/realm/${realmCode}/tavern`);

    } catch (err: any) {
      console.error(err);
      setServerError(err.message || "The spell fizzled. An unknown error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find current selected theme object for preview
  const selectedTheme = availableThemes.find(t => t.key === selectedThemeKey) || availableThemes[0]!;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative">
       <RealmBackground /> 

       {/* Entrance Animation */}
       <motion.div 
         initial={{ opacity: 0, y: 8 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.3, ease: "easeOut" }}
         className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
       >
          
          {/* Main Form Panel */}
          <div className="lg:col-span-7 w-full bg-[var(--pr-surface)] border border-[var(--pr-border)] rounded-[var(--pr-radius-xl)] shadow-[var(--pr-shadow-soft)] overflow-hidden relative">
              {/* Radial Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[var(--pr-primary)] opacity-[0.03] blur-3xl pointer-events-none" />

              <div className="p-6 md:p-8 relative z-10">
                  <header className="mb-6">
                      <h1 className="text-2xl font-bold text-[var(--pr-primary)] mb-2" style={{ fontFamily: 'var(--pr-heading-font)' }}>Create Realm</h1>
                      <p className="text-[var(--pr-text-muted)] text-sm">
                          Forge a new realm for your party. Settings can be adjusted later by the Game Master.
                      </p>
                  </header>

                  {serverError && (
                      <div className="mb-6 p-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-danger)]/10 border border-[var(--pr-danger)] text-[var(--pr-danger)] flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                              <strong className="block font-bold">The spell fizzled.</strong>
                              <span className="text-sm opacity-90">{serverError}</span>
                          </div>
                      </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      
                      {/* Identity */}
                      <div className="space-y-4">
                          <h2 className="text-sm uppercase tracking-wider font-bold text-[var(--pr-text-muted)] border-b border-[var(--pr-border)] pb-2 mb-4 flex items-center gap-2">
                              Summoning Circle
                          </h2>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--pr-text)]">Realm Name <span className="text-[var(--pr-text-muted)] font-normal">(Optional)</span></label>
                                <input
                                    {...form.register("realmName")}
                                    className="w-full p-2.5 rounded-[var(--pr-radius-md)] bg-[var(--pr-bg)] border border-[var(--pr-border)] focus:border-[var(--pr-primary)] focus:ring-1 focus:ring-[var(--pr-primary)] outline-none transition-all"
                                    placeholder="e.g. The Sprint Retrospective"
                                    disabled={isSubmitting}
                                />
                                {errors.realmName && <p className="text-xs text-[var(--pr-danger)]">{errors.realmName.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--pr-text)]">Your Display Name</label>
                                <input
                                    {...form.register("displayName")}
                                    className="w-full p-2.5 rounded-[var(--pr-radius-md)] bg-[var(--pr-bg)] border border-[var(--pr-border)] focus:border-[var(--pr-primary)] focus:ring-1 focus:ring-[var(--pr-primary)] outline-none transition-all"
                                    placeholder="e.g. Gandalf"
                                    disabled={isSubmitting}
                                />
                                {errors.displayName && <p className="text-xs text-[var(--pr-danger)]">{errors.displayName.message}</p>}
                            </div>
                          </div>
                      </div>

                      {/* Theme */}
                      <div className="space-y-1.5">
                           <Controller
                              control={control}
                              name="themeKey"
                              render={({ field }) => (
                                  <ThemePicker 
                                    selectedThemeKey={field.value} 
                                    onThemeSelect={field.onChange} 
                                  />
                              )}
                           />
                      </div>

                      {/* Mechanics */}
                      <div className="space-y-4 pt-4">
                          <h2 className="text-sm uppercase tracking-wider font-bold text-[var(--pr-text-muted)] border-b border-[var(--pr-border)] pb-2 mb-4 flex items-center gap-2">
                              Mechanics
                          </h2>
                          
                          <div className="space-y-4">
                              <div className="space-y-1.5">
                                  <label className="text-sm font-medium text-[var(--pr-text)]">Deck Type</label>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      {(["FIBONACCI", "SHORT_FIBONACCI", "TSHIRT", "CUSTOM"] as const).map(type => (
                                          <button
                                              key={type}
                                              type="button"
                                              onClick={() => setValue("deckType", type)}
                                              className={`
                                                  p-2 text-sm rounded-[var(--pr-radius-md)] border text-center transition-all
                                                  ${selectedDeckType === type 
                                                      ? "border-[var(--pr-primary)] bg-[var(--pr-primary)]/10 text-[var(--pr-primary)] font-bold shadow-[var(--pr-primary-glow)]" 
                                                      : "border-[var(--pr-border)] bg-[var(--pr-bg)] text-[var(--pr-text-muted)] hover:border-[var(--pr-text-muted)]"
                                                  }
                                              `}
                                          >
                                              {type === "SHORT_FIBONACCI" ? "Short Fib." : type.charAt(0) + type.slice(1).toLowerCase()}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              {selectedDeckType === "CUSTOM" && (
                                  <div className="space-y-1.5">
                                      <label className="text-sm font-medium text-[var(--pr-text)]">Custom Values</label>
                                      <input
                                          {...form.register("customDeckValuesInput")}
                                          className="w-full p-2.5 rounded-[var(--pr-radius-md)] bg-[var(--pr-bg)] border border-[var(--pr-border)] focus:border-[var(--pr-primary)] focus:ring-1 focus:ring-[var(--pr-primary)] outline-none transition-all font-mono text-sm"
                                          placeholder="0, 1, 2, 3, 5, 8, 13, ?, ☕"
                                          disabled={isSubmitting}
                                      />
                                      <p className="text-xs text-[var(--pr-text-muted)]">Comma separated. Max 24 values.</p>
                                      {errors.customDeckValuesInput && <p className="text-xs text-[var(--pr-danger)]">{errors.customDeckValuesInput.message}</p>}
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-3 pt-2">
                           <div className="flex items-start gap-3">
                                <div className="flex items-center h-5">
                                    <input
                                        id="autoReveal"
                                        type="checkbox"
                                        {...form.register("autoReveal")}
                                        className="w-4 h-4 rounded border-gray-300 text-[var(--pr-primary)] focus:ring-[var(--pr-primary)]"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="autoReveal" className="text-sm font-medium text-[var(--pr-text)] flex items-center gap-2">
                                        <Eye className="w-4 h-4" /> Auto Reveal
                                    </label>
                                    <p className="text-xs text-[var(--pr-text-muted)]">Reveal when all party members have chosen.</p>
                                </div>
                           </div>

                           <div className="flex items-start gap-3">
                                <div className="flex items-center h-5">
                                    <input
                                        id="allowAbstain"
                                        type="checkbox"
                                        {...form.register("allowAbstain")}
                                        className="w-4 h-4 rounded border-gray-300 text-[var(--pr-primary)] focus:ring-[var(--pr-primary)]"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="allowAbstain" className="text-sm font-medium text-[var(--pr-text)] flex items-center gap-2">
                                        <UserX className="w-4 h-4" /> Allow Abstain
                                    </label>
                                    <p className="text-xs text-[var(--pr-text-muted)]">Allow '?' for uncertainty.</p>
                                </div>
                           </div>
                           
                           <div className="flex items-start gap-3">
                                <div className="flex items-center h-5">
                                    <input
                                        id="hideVoteCounts"
                                        type="checkbox"
                                        {...form.register("hideVoteCounts")}
                                        className="w-4 h-4 rounded border-gray-300 text-[var(--pr-primary)] focus:ring-[var(--pr-primary)]"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="hideVoteCounts" className="text-sm font-medium text-[var(--pr-text)] flex items-center gap-2">
                                        <EyeOff className="w-4 h-4" /> Hide Vote Counts
                                    </label>
                                    <p className="text-xs text-[var(--pr-text-muted)]">Keep progress secret until the prophecy is revealed.</p>
                                </div>
                           </div>
                      </div>

                      <div className="pt-6">
                           <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center py-3 px-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-primary)] text-[var(--pr-bg)] font-bold text-lg shadow-[var(--pr-shadow-soft)] hover:shadow-[var(--pr-shadow-hover)] hover:translate-y-[-1px] active:translate-y-[0px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Casting Spell...
                                    </>
                                ) : (
                                    <>
                                        <Dice5 className="w-5 h-5 mr-2" />
                                        Create Realm
                                    </>
                                )}
                           </button>
                      </div>

                  </form>
              </div>
          </div>

          {/* Preview Panel (Desktop) */}
          <div className="hidden lg:block lg:col-span-5 sticky top-8">
              <ThemePreview theme={selectedTheme} />
              
              <div className="mt-8 p-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-surface)] border border-[var(--pr-border)]">
                  <h3 className="text-sm font-bold text-[var(--pr-text)] mb-2">About {selectedTheme.name}</h3>
                  <p className="text-sm text-[var(--pr-text-muted)]">
                      {selectedTheme.description}
                  </p>
              </div>
          </div>

       </motion.div>
    </div>
  );
}
