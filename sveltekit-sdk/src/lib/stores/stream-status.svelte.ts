import type { PropStatus, StreamStatus } from "../types.js";

/**
 * Stream status store interface
 */
export interface StreamStatusStore {
  readonly isStreaming: boolean;
  readonly isComplete: boolean;
  readonly propStatuses: PropStatus[];
  readonly status: StreamStatus;
  setStreaming(streaming: boolean): void;
  setComplete(complete: boolean): void;
  updatePropStatus(
    key: string,
    isStreaming: boolean,
    isComplete: boolean,
  ): void;
  reset(): void;
}

/**
 * Create a stream status store for tracking streaming state
 * @returns Stream status store with reactive state
 */
export function createStreamStatusStore(): StreamStatusStore {
  let isStreaming = $state(false);
  let isComplete = $state(true);
  let propStatuses = $state<PropStatus[]>([]);

  const status = $derived<StreamStatus>({
    isStreaming,
    isComplete,
    propStatuses,
  });

  function setStreaming(streaming: boolean): void {
    isStreaming = streaming;
    if (streaming) {
      isComplete = false;
    }
  }

  function setComplete(complete: boolean): void {
    isComplete = complete;
    if (complete) {
      isStreaming = false;
    }
  }

  function updatePropStatus(
    key: string,
    propIsStreaming: boolean,
    propIsComplete: boolean,
  ): void {
    const existing = propStatuses.findIndex((p) => p.key === key);
    const newStatus: PropStatus = {
      key,
      isStreaming: propIsStreaming,
      isComplete: propIsComplete,
    };

    if (existing >= 0) {
      propStatuses = [
        ...propStatuses.slice(0, existing),
        newStatus,
        ...propStatuses.slice(existing + 1),
      ];
    } else {
      propStatuses = [...propStatuses, newStatus];
    }
  }

  function reset(): void {
    isStreaming = false;
    isComplete = true;
    propStatuses = [];
  }

  return {
    get isStreaming() {
      return isStreaming;
    },
    get isComplete() {
      return isComplete;
    },
    get propStatuses() {
      return propStatuses;
    },
    get status() {
      return status;
    },
    setStreaming,
    setComplete,
    updatePropStatus,
    reset,
  };
}

export type { StreamStatusStore as StreamStatusStoreType };
