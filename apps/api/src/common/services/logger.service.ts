import { Injectable, Logger, Scope } from "@nestjs/common";
import { RequestLog } from "../middleware/request-logger.middleware";

@Injectable({ scope: Scope.REQUEST })
export class CorrelationLoggerService extends Logger {
  private correlationId?: string;

  setCorrelationId(correlationId: string) {
    this.correlationId = correlationId;
  }

  log(message: unknown) {
    super.log(this.formatMessage(message));
  }

  error(message: unknown, trace?: string) {
    super.error(this.formatMessage(message), trace);
  }

  warn(message: unknown) {
    super.warn(this.formatMessage(message));
  }

  debug(message: unknown) {
    super.debug(this.formatMessage(message));
  }

  verbose(message: unknown) {
    super.verbose(this.formatMessage(message));
  }

  logRequest(log: RequestLog) {
    this.log(JSON.stringify(log));
  }

  formatMessage(message: unknown): string {
    const formattedMessage = this.stringifyMessage(message);

    if (!this.correlationId) {
      return formattedMessage;
    }

    return `[correlationId: ${this.correlationId}] ${formattedMessage}`;
  }

  stringifyMessage(message: unknown): string {
    if (typeof message === "string") {
      return message;
    }

    if (message instanceof Error) {
      return message.stack ?? message.message;
    }

    if (typeof message === "object" && message !== null) {
      try {
        return JSON.stringify(message);
      } catch {
        return "[unserializable object]";
      }
    }

    return String(message);
  }
}
