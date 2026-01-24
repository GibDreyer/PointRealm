import { Outlet, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "../../api/client";
import { useTheme } from "../../theme/ThemeProvider";
import { getRecentRealms, addOrUpdateRecentRealm } from "../../lib/storage";

export function RealmShell() {
  const { code } = useParams<{ code: string }>();
  // Alias it to realmCode if we want, or just use code
  const realmCode = code;
  const { setThemeKey } = useTheme();

  const { data: realm } = useQuery({
    queryKey: ['realm', realmCode],
    queryFn: () => api.get<{ themeKey: string, name: string }>(`/realms/${realmCode}`),
    enabled: !!realmCode
  });

  useEffect(() => {
    if (realm?.themeKey) {
      setThemeKey(realm.themeKey);
    }

    if (realm && realmCode) {
      // Update persistence if we have seen this realm before
      // This ensures we refresh the "lastVisitedAt" timestamp and sync name/theme
      const recent = getRecentRealms();
      const existing = recent.find(r => r.realmCode.toUpperCase() === realmCode.toUpperCase());
      
      if (existing) {
        addOrUpdateRecentRealm({
          realmCode: existing.realmCode,
          displayNameUsed: existing.displayNameUsed,
          joinUrl: existing.joinUrl,
          realmName: realm.name || existing.realmName,
          themeKey: realm.themeKey || existing.themeKey,
          role: existing.role
        });
      }
    }
  }, [realm, realmCode, setThemeKey]);

  return (
    <div className="min-h-screen bg-[var(--pr-bg)] text-[var(--pr-text)] flex transition-colors duration-300">
      <aside className="w-64 border-r border-[var(--pr-border)] p-4 hidden md:block bg-[var(--pr-surface)]">
        <h2 className="font-bold mb-4 text-[var(--pr-primary)]" style={{ fontFamily: 'var(--pr-heading-font)' }}>
            {realm?.name || 'Realm Menu'}
        </h2>
        {/* Sidebar Placeholder */}
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
