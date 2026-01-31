import { BadRequestException } from "@nestjs/common";

export interface V1CompoundCursor {
  createdAt: Date;
  id: string;
  /** Optional scope identifier (e.g., messageId) for cursor validation */
  messageId?: string;
}

export function encodeV1CompoundCursor(cursor: V1CompoundCursor): string {
  if (!cursor.id) {
    throw new Error("Cannot encode cursor: id is empty");
  }

  if (Number.isNaN(cursor.createdAt.getTime())) {
    throw new Error("Cannot encode cursor: createdAt is invalid");
  }

  const payload: Record<string, string> = {
    createdAt: cursor.createdAt.toISOString(),
    id: cursor.id,
  };

  // Include messageId if provided for cursor scoping
  if (cursor.messageId) {
    payload.messageId = cursor.messageId;
  }

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function parseV1CompoundCursor(encoded: string): V1CompoundCursor {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new BadRequestException("Invalid cursor");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new BadRequestException("Invalid cursor");
  }

  const createdAt = (parsed as { createdAt?: unknown }).createdAt;
  const id = (parsed as { id?: unknown }).id;
  const messageId = (parsed as { messageId?: unknown }).messageId;

  if (typeof createdAt !== "string" || typeof id !== "string" || id === "") {
    throw new BadRequestException("Invalid cursor");
  }

  // messageId is optional but must be a non-empty string if present
  if (
    messageId !== undefined &&
    (typeof messageId !== "string" || messageId === "")
  ) {
    throw new BadRequestException("Invalid cursor");
  }

  const createdAtDate = new Date(createdAt);
  if (Number.isNaN(createdAtDate.getTime())) {
    throw new BadRequestException("Invalid cursor");
  }

  return {
    createdAt: createdAtDate,
    id,
    messageId,
  };
}
