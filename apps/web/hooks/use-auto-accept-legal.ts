"use client";

import { useRef } from "react";
import { LEGAL_CONFIG } from "@/lib/legal-config";
import {
  hasPendingLegalCookie,
  clearPendingLegalCookie,
} from "@/lib/pending-legal-cookie";
import { api } from "@/trpc/react";

interface LegalStatus {
  accepted: boolean;
  acceptedAt?: Date | null;
  version?: string | null;
  needsUpdate?: boolean;
}

/**
 * Hook that auto-accepts legal terms if a pending acceptance cookie exists.
 *
 * This handles the case where users check the legal checkbox on the first
 * screen before signing in with Google/GitHub. After OAuth completes,
 * this hook detects the cookie and automatically accepts legal terms.
 *
 * @returns isPending - true while the auto-accept mutation is in progress
 */
export function useAutoAcceptLegal(legalStatus: LegalStatus | undefined) {
  const utils = api.useUtils();
  const isAutoAcceptingRef = useRef(false);

  const acceptLegalMutation = api.user.acceptLegal.useMutation({
    onSuccess: async () => {
      clearPendingLegalCookie();
      utils.user.hasAcceptedLegal.setData(undefined, (prev) => ({
        accepted: true,
        acceptedAt: new Date(),
        version: LEGAL_CONFIG.CURRENT_VERSION,
        needsUpdate: false,
        ...(prev ?? {}),
      }));
      await utils.user.hasAcceptedLegal.invalidate();
    },
    onError: () => {
      // If auto-accept fails, clear the cookie and let them accept manually
      clearPendingLegalCookie();
      isAutoAcceptingRef.current = false;
    },
  });

  /**
   * Attempts to auto-accept legal terms if conditions are met.
   * @returns true if auto-accept was triggered or is in progress
   */
  function tryAutoAccept(): boolean {
    if (
      legalStatus &&
      !legalStatus.accepted &&
      hasPendingLegalCookie() &&
      !isAutoAcceptingRef.current &&
      !acceptLegalMutation.isPending
    ) {
      isAutoAcceptingRef.current = true;
      acceptLegalMutation.mutate({ version: LEGAL_CONFIG.CURRENT_VERSION });
      return true;
    }
    return isAutoAcceptingRef.current || acceptLegalMutation.isPending;
  }

  /**
   * Checks if we should redirect to legal acceptance page.
   * Returns false if we have a pending cookie (will auto-accept instead).
   */
  function shouldRedirectToLegalPage(): boolean {
    return (
      !!legalStatus &&
      !legalStatus.accepted &&
      !hasPendingLegalCookie() &&
      !isAutoAcceptingRef.current
    );
  }

  return {
    isPending: acceptLegalMutation.isPending,
    tryAutoAccept,
    shouldRedirectToLegalPage,
  };
}
