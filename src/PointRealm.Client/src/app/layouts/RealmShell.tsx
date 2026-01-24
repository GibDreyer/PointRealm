import { Outlet } from "react-router-dom";

export function RealmShell() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased flex">
      <aside className="w-64 border-r p-4 hidden md:block">
        <h2 className="font-bold mb-4">Realm Menu</h2>
        {/* Sidebar Placeholder */}
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
