"use client";

import Image from "next/image";
import { env } from "@/lib/env";

/**
 * Renders the partner-org logo and/or name when whitelabel env vars are set.
 *
 * Values are read once at module scope to avoid repeated runtime checks.
 * If neither value is present the component returns `null` (nothing rendered).
 *
 * Tailwind layout utilities intentionally avoid margin-left (`ml-*`).
 * Instead we pad the group with `pl-2` and rely on `gap-2` for spacing
 * between the Tambo logo, partner logo, and partner name.
 */
export function WhitelabelBadge() {
  // Evaluate once so JSX stays tidy.
  const hasLogo = Boolean(env.NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_LOGO);
  const hasName = Boolean(env.NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_NAME);
  const hasWhitelabelConfig = hasLogo || hasName;

  if (!hasWhitelabelConfig) return null;

  return (
    <span className="flex items-center gap-2 pl-2">
      {hasLogo && (
        <Image
          src={env.NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_LOGO!}
          // Use 24 px height (matching `h-6`) and generous width; CSS keeps it auto.
          height={24}
          width={96}
          // H-6 width-auto styles maintain consistent sizing in flex row.
          className="h-6 w-auto"
          alt={
            hasName
              ? `${env.NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_NAME} logo`
              : "Organization logo"
          }
          // Disable Next.js priority unless running on homepage; default is fine.
          // priority={false}
        />
      )}

      {hasName && (
        <span className="text-sm font-medium">
          {env.NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_NAME}
        </span>
      )}
    </span>
  );
}
