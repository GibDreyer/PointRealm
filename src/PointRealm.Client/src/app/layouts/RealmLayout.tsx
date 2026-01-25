import { Outlet, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "../../api/client";
import { useTheme } from "../../theme/ThemeProvider";
import { getRecentRealms, addOrUpdateRecentRealm } from "../../lib/storage";
import { RealmShell } from "./RealmShell"; // Using the visual shell

export function RealmLayout() {
  const { code } = useParams<{ code: string }>();
  const realmCode = code;
  const { setThemeKey } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (realmCode) {
      const token = sessionStorage.getItem(`pointrealm:v1:realm:${realmCode}:token`);
      if (!token) {
        navigate(`/join?realmCode=${realmCode}`, { replace: true });
      }
    }
  }, [realmCode, navigate]);

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

  // Visual Wrapper
  return (
    <RealmShell showBackground={true}>
      <Outlet />
    </RealmShell>
  );
}
