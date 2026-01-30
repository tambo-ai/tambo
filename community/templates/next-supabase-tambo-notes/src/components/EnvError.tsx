'use client'

import { SupabaseError } from './SupabaseError'

/**
 * Legacy component - redirects to SupabaseError for consistency
 * @deprecated Use SupabaseError or TamboError directly
 */
export function EnvError() {
  return <SupabaseError />
}
