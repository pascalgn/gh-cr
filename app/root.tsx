import "@mantine/core/styles.css";
import "./app.css";

import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const isResponse = isRouteErrorResponse(error);
  const message = isResponse ? `${error.status}` : "Error";
  const details = isResponse
    ? error.statusText || "Something went wrong."
    : error instanceof Error
      ? error.message
      : "Something went wrong.";
  const stack = error instanceof Error ? error.stack : undefined;

  return (
    <main className="errorBoundary">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack ? (
        <pre>
          <code>{stack}</code>
        </pre>
      ) : null}
    </main>
  );
}
