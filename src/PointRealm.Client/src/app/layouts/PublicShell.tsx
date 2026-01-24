import { Outlet } from "react-router-dom";

export function PublicShell() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <header className="border-b p-4">
        <div className="container flex items-center justify-between">
            <h1 className="text-xl font-bold">PointRealm</h1>
            <nav>
                {/* Nav Placeholder */}
            </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
