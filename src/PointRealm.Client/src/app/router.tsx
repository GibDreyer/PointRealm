import { createBrowserRouter } from "react-router-dom";
import { PublicShell } from "@/app/layouts/PublicShell";
import { RealmShell } from "@/app/layouts/RealmShell";
import { LandingPage } from "@/features/landing/LandingPage";
import { CreateRealmPage } from "@/features/createRealm/CreateRealmPage";
import { JoinRealmPage } from "@/features/joinRealm/JoinRealmPage";
import { LobbyPage } from "@/features/realmLobby/LobbyPage";
import { PlayPage } from "@/features/realmPlay/PlayPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ErrorPage } from "@/components/ErrorPage";
import { NotFoundPage } from "@/components/NotFoundPage";

export const router = createBrowserRouter([
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
        element: <LobbyPage />,
      },
      {
        path: "tavern",
        element: <LobbyPage />,
      },
      {
        path: "play",
        element: <PlayPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
