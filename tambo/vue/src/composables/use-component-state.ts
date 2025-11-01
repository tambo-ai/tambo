import { ref, watch, onBeforeUnmount } from "vue";
import { useTamboThread } from "../providers/tambo-thread-provider";
import { useTamboClient } from "../providers/tambo-client-provider";
import { useTamboCurrentMessage } from "./use-current-message";

export function useTamboComponentState<S = undefined>(
  keyName: string,
  initialValue?: S,
  setFromProp?: S,
  debounceTime = 500,
): [S | undefined, (newState: S) => void] {
  const message = useTamboCurrentMessage();
  const { updateThreadMessage } = useTamboThread();
  const client = useTamboClient();
  const messageState = (message as any)?.componentState?.[keyName] as S | undefined;
  const localState = ref<S | undefined>((messageState as S) ?? initialValue);
  const initializedFromThreadMessage = ref(!!messageState);

  const updateLocalThreadMessage = (newState: S) => {
    const updatedMessage = {
      threadId: (message as any).threadId,
      componentState: { ...(message as any).componentState, [keyName]: newState },
    } as any;
    updateThreadMessage((message as any).id, updatedMessage, false);
  };

  let timeout: any = null;
  const flush = async () => {
    if (timeout) clearTimeout(timeout);
  };
  const updateRemoteThreadMessage = async (newState: S) => {
    await (client as any).beta.threads.messages.updateComponentState(
      (message as any).threadId,
      (message as any).id,
      { state: { [keyName]: newState } },
    );
  };

  const setValue = (newState: S) => {
    localState.value = newState;
    updateLocalThreadMessage(newState);
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => updateRemoteThreadMessage(newState), debounceTime);
  };

  watch(
    () => (message as any)?.componentState?.[keyName],
    (val) => {
      if (val === undefined || val === null) return;
      initializedFromThreadMessage.value = true;
      localState.value = (message as any).componentState?.[keyName] as S;
    },
  );

  watch(
    () => setFromProp,
    (val) => {
      if (val !== undefined && !initializedFromThreadMessage.value) {
        localState.value = val as S;
      }
    },
  );

  onBeforeUnmount(() => flush());

  return [localState.value as S, setValue];
}

