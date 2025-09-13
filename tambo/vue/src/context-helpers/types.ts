export interface AdditionalContext {
  name: string;
  context: any;
}

export type ContextHelperFn = () => any | null | undefined | Promise<any | null | undefined>;

export type ContextHelpers = Record<string, ContextHelperFn>;

