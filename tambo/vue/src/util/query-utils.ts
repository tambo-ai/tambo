export type CombinedMutationResult<TData = unknown, TError = unknown> = {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  isPaused?: boolean;
  submittedAt?: number;
  status: 'pending' | 'success' | 'error' | 'idle';
  error?: TError | null;
  failureCount?: number;
  failureReason?: unknown;
};

export function combineMutationResults(a: any, b: any): CombinedMutationResult {
  return {
    isPending: !!(a?.isPending || b?.isPending),
    isSuccess: !!(a?.isSuccess && b?.isSuccess),
    isError: !!(a?.isError || b?.isError),
    isIdle: !!(a?.isIdle && b?.isIdle),
    isPaused: a?.isPaused || b?.isPaused,
    submittedAt: a?.submittedAt || b?.submittedAt,
    status: a?.isPending || b?.isPending ? 'pending' : a?.isError || b?.isError ? 'error' : a?.isSuccess && b?.isSuccess ? 'success' : 'idle',
    error: a?.error ?? b?.error ?? null,
    failureCount: (a?.failureCount || 0) + (b?.failureCount || 0),
    failureReason: a?.failureReason ?? b?.failureReason,
  };
}

