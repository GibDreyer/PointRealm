import { createBrowserRouter } from "react-router-dom";

import { RealmLayout } from "@/app/layouts/RealmLayout"; // Logic/Data layout
import { LandingPage } from "@/features/landing/LandingPage";
import { CreateRealmPage } from "@/features/createRealm/CreateRealmPage";
import { JoinRealmPage } from "@/features/joinRealm/JoinRealmPage";

import { AccountPage } from "@/features/account/AccountPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ErrorPage } from "@/components/ErrorPage";
import { NotFoundPage } from "@/components/NotFoundPage";
import { RealmScreen } from "@/features/realmPlay/RealmScreen";
import { DevComponentsPage } from "@/features/dev/DevComponentsPage";
import { StressTestPage } from "@/features/dev/StressTestPage";

export const router = createBrowserRouter([
  {
    path: "/dev/components",
    element: <DevComponentsPage />,
  },
  {
    path: "/dev/create-test",
    element: <StressTestPage />,
  },
  {
    path: "/",
    // We use RealmShell directly in pages or here? 
    // LandingPage has its own RealmShell. Create/Join should probably have one too.
    // If we put it here, LandingPage gets double wrapped.
    // Let's use a Outlet-only wrapper or nothing if pages handle it.
    // Spec says 'Full-page PageShell' for Landing.
    // Start with no shell here, let pages define their shell (or use a shared visual layout if content allows).
    // Given the visual differences (Landing is unique), let's keep it simple.
    // Actually, Create/Join/Landing all share "Public" context.
    element: <OutletLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <LandingPage />, 
      },
      {
        path: "create",
        element: <CreateRealmPage />,
      },
      {
        path: "join",
        element: <JoinRealmPage />,
      },
      {
        path: "auth/login",
        element: <LoginPage />,
      },
      {
        path: "auth/register",
        element: <RegisterPage />,
      },
      {
        path: "account",
        element: <AccountPage />,
      },
    ],
  },
  {
    path: "/realm/:code",
    element: <RealmLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <RealmScreen />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

import { Outlet } from "react-router-dom";
function OutletLayout() {
  return <Outlet />;
}
