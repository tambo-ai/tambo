import { Injectable, NestMiddleware } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import { NextFunction, Request, Response } from "express";

/**
 * Flush Sentry spans/events periodically during long-running responses (e.g. SSE streams).
 *
 * Without this, an infrastructure timeout (e.g. a 15-minute load balancer limit) can kill
 * the connection before Sentry's internal buffer is drained, causing in-flight spans to be
 * silently lost. This middleware starts a periodic flush once it detects that an SSE stream
 * has been open for longer than FLUSH_DELAY_MS, and also flushes on abnormal connection close.
 */

/** Wait this long before starting periodic flushes (skip short-lived requests). */
const FLUSH_DELAY_MS = 10_000;

/** Flush every this many milliseconds once streaming has started. */
const FLUSH_INTERVAL_MS = 30_000;

/** Max time to wait for a flush to complete (non-blocking, fire-and-forget). */
const FLUSH_TIMEOUT_MS = 2_000;

@Injectable()
export class SentryFlushMiddleware implements NestMiddleware {
  use(_request: Request, response: Response, next: NextFunction): void {
    let flushTimer: ReturnType<typeof setInterval> | undefined;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;

    // Start periodic flushing after the initial delay so we don't add overhead
    // to quick request/response cycles.
    delayTimer = setTimeout(() => {
      flushTimer = setInterval(
        () => void Sentry.flush(FLUSH_TIMEOUT_MS),
        FLUSH_INTERVAL_MS,
      );
    }, FLUSH_DELAY_MS);

    const cleanup = () => {
      if (delayTimer) {
        clearTimeout(delayTimer);
        delayTimer = undefined;
      }
      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = undefined;
      }
    };

    // "finish" fires when the response is done writing (normal completion).
    response.on("finish", cleanup);

    // "close" fires when the underlying connection is terminated — possibly by
    // an infrastructure timeout before finish. Flush remaining spans.
    response.on("close", () => {
      cleanup();
      void Sentry.flush(FLUSH_TIMEOUT_MS);
    });

    next();
  }
}
