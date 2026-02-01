import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ClerkProvider } from "@clerk/react-router";
import { rootAuthLoader } from "@clerk/react-router/ssr.server";
import { ClientTamboProvider } from "./components/ClientTamboProvider";
import type { LoaderFunctionArgs } from "react-router";

import stylesheet from "./styles/app.css?url";

export const links = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "icon", type: "image/x-icon", href: "/favicon.svg" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "stylesheet", href: stylesheet },
];

export const loader = (args: LoaderFunctionArgs) => {
  return rootAuthLoader(args);
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

interface AppProps {
  loaderData: unknown;
}

export default function App({ loaderData }: AppProps) {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      loaderData={loaderData}
    >
      <ClientTamboProvider>
        <Outlet />
      </ClientTamboProvider>
    </ClerkProvider>
  );
}
