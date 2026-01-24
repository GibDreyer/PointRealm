import { createBrowserRouter } from "react-router-dom";
import { PublicShell } from "@/app/layouts/PublicShell";
import { RealmShell } from "@/app/layouts/RealmShell";
import { LandingPage } from "@/features/landing/LandingPage";
import { CreateRealmPage } from "@/features/createRealm/CreateRealmPage";
import { JoinRealmPage } from "@/features/joinRealm/JoinRealmPage";
import { TavernLobbyPage } from "@/features/realmLobby/LobbyPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ErrorPage } from "@/components/ErrorPage";
import { NotFoundPage } from "@/components/NotFoundPage";
import { RealmScreen } from "@/features/realmPlay/RealmScreen";
import { DevComponentsPage } from "@/features/dev/DevComponentsPage";

export const router = createBrowserRouter([
  {
    path: "/dev/components",
    element: <DevComponentsPage />,
  },
  {
    path: "/",
    element: <PublicShell />,
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
    ],
  },
  {
    path: "/realm/:code",
    element: <RealmShell />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "lobby",
        element: <TavernLobbyPage />,
      },
      {
        path: "tavern",
        element: <TavernLobbyPage />,
      },
    ],
  },
  {
    path: "/realm/:code/play",
    element: <RealmScreen />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/realms/:realmCode",
    element: <RealmScreen />,
    errorElement: <ErrorPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
