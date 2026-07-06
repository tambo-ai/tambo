import {
  EventType,
  type CustomEvent,
  type RunStartedEvent,
  type TextMessageEndEvent,
  type TextMessageStartEvent,
} from "@ag-ui/core";
import { transformEventMessageIds } from "./v1.service";

describe("transformEventMessageIds", () => {
  const start = (messageId: string): TextMessageStartEvent => ({
    type: EventType.TEXT_MESSAGE_START,
    role: "assistant",
    messageId,
  });
  const end = (messageId: string): TextMessageEndEvent => ({
    type: EventType.TEXT_MESSAGE_END,
    messageId,
  });

  it("maps a temp ID to the real DB ID when it is available", () => {
    const mapping = new Map<string, string>();

    const started = transformEventMessageIds(
      start("message-temp"),
      "msg_real",
      mapping,
    ) as TextMessageStartEvent;
    const ended = transformEventMessageIds(
      end("message-temp"),
      "msg_real",
      mapping,
    ) as TextMessageEndEvent;

    expect(started.messageId).toBe("msg_real");
    expect(ended.messageId).toBe("msg_real");
  });

  it("keeps the temp ID stable when START precedes persistence, even if END carries the real ID", () => {
    const mapping = new Map<string, string>();

    // START is emitted before the message is persisted (no real ID yet).
    const started = transformEventMessageIds(
      start("message-temp"),
      undefined,
      mapping,
    ) as TextMessageStartEvent;
    // END arrives after persistence, but the temp ID is already locked in.
    const ended = transformEventMessageIds(
      end("message-temp"),
      "msg_real",
      mapping,
    ) as TextMessageEndEvent;

    expect(started.messageId).toBe("message-temp");
    expect(ended.messageId).toBe("message-temp");
  });

  it("locks tambo.component.start message IDs the same way", () => {
    const mapping = new Map<string, string>();
    const componentStart = (messageId: string): CustomEvent => ({
      type: EventType.CUSTOM,
      name: "tambo.component.start",
      value: { messageId },
    });

    const first = transformEventMessageIds(
      componentStart("message-temp"),
      undefined,
      mapping,
    ) as CustomEvent;
    const second = transformEventMessageIds(
      end("message-temp"),
      "msg_real",
      mapping,
    ) as TextMessageEndEvent;

    expect((first.value as { messageId: string }).messageId).toBe(
      "message-temp",
    );
    expect(second.messageId).toBe("message-temp");
  });

  it("leaves events without a message ID untouched", () => {
    const mapping = new Map<string, string>();
    const runStarted: RunStartedEvent = {
      type: EventType.RUN_STARTED,
      threadId: "thr_1",
      runId: "run_1",
    };

    expect(transformEventMessageIds(runStarted, "msg_real", mapping)).toBe(
      runStarted,
    );
  });
});
