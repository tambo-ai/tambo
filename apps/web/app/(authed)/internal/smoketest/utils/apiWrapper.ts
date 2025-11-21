import { encodingForModel } from "js-tiktoken";

interface WrappedApi<T, A extends unknown[]> {
  call: (...args: A) => Promise<T>;
  pause: () => void;
  unpause: () => void;
  setNextError: (shouldError: boolean) => void;
  getState: () => {
    isPaused: boolean;
    shouldError: boolean;
    isRunning: boolean;
    startTime: number | null;
    duration: number | null;
    tokens: number | null;
  };
}

export function wrapApiCall<A extends unknown[], T>(
  apiCall: (...args: A) => Promise<T>,
  onStateChange: (
    isRunning: boolean,
    startTime: number | null,
    duration: number | null,
    tokens: number | null,
  ) => void,
): WrappedApi<T, A> {
  let isPaused = false;
  let shouldError = false;
  let isRunning = false;
  let isPausedWhileRunning = false;
  let startTime: number | null = null;
  let duration: number | null = null;
  let tokens: number | null = null;

  let pauseResolve: (() => void) | null = null;
  let currentPausePromise: Promise<void> | null = null;

  const tokenizer = encodingForModel("gpt-4o");

  const waitForUnpause = async () => {
    if (!isPaused) return;

    if (!currentPausePromise) {
      currentPausePromise = new Promise<void>((resolve) => {
        pauseResolve = resolve;
      });
    }

    await currentPausePromise;
  };

  const wrappedCall = async (...args: A): Promise<T> => {
    startTime = Date.now();
    isRunning = true;
    duration = null;
    tokens = null;
    onStateChange(true, startTime, null, null);

    try {
      if (shouldError) {
        shouldError = false;
        throw new Error("API error triggered");
      }

      await waitForUnpause();

      if (!isPausedWhileRunning) {
        startTime = Date.now();
        onStateChange(true, startTime, null, null);
      }

      const result = await apiCall(...args);
      duration = (Date.now() - startTime) / 1000;

      const responseText =
        typeof result === "string" ? result : JSON.stringify(result);
      tokens = tokenizer.encode(responseText).length;

      isRunning = false;
      isPausedWhileRunning = false;
      onStateChange(false, null, duration, tokens);
      return result;
    } catch (error) {
      duration = (Date.now() - startTime) / 1000;
      isRunning = false;
      isPausedWhileRunning = false;
      onStateChange(false, null, duration, null);
      throw error;
    }
  };

  return {
    call: wrappedCall,
    pause: () => {
      isPaused = true;
      if (isRunning) {
        isPausedWhileRunning = true;
      }
      currentPausePromise = new Promise<void>((resolve) => {
        pauseResolve = resolve;
      });
    },
    unpause: () => {
      isPaused = false;
      if (pauseResolve) {
        pauseResolve();
        pauseResolve = null;
        currentPausePromise = null;
      }
    },
    setNextError: (nextShouldError: boolean) => {
      shouldError = nextShouldError;
    },
    getState: () => ({
      isPaused,
      shouldError,
      isRunning: isRunning || isPausedWhileRunning,
      startTime,
      duration,
      tokens,
    }),
  };
}
