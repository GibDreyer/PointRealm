import { RouterProvider } from "react-router-dom";
import { RootProvider } from "@/app/providers/RootProvider";
import { router } from "@/app/router";

function App() {
  return (
    <RootProvider>
      <RouterProvider router={router} />
    </RootProvider>
  );
}

export default App;
