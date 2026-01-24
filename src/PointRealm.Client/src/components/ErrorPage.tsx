import { useRouteError } from "react-router-dom";

export function ErrorPage() {
  const error = useRouteError() as any;
  console.error(error);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Oops!</h1>
      <p className="text-xl mb-4">Sorry, an unexpected error has occurred.</p>
      <p className="text-muted-foreground">
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
}
