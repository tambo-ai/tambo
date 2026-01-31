"use client";

import { TamboProvider } from "@tambo-ai/react";
import { tamboComponents } from "./components";
import type { ReactNode } from "react";

interface TamboWrapperProps {
    children: ReactNode;
}

export default function TamboWrapper({ children }: TamboWrapperProps) {
    const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

    if (!apiKey) {
        // Render children without TamboProvider when no API key
        // The TamboChat component will handle showing the demo state
        return <>{children}</>;
    }

    return (
        <TamboProvider apiKey={apiKey} components={tamboComponents}>
            {children}
        </TamboProvider>
    );
}
