// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
const environment =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
  process.env.NODE_ENV ||
  "development";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment,

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Filter out browser extension errors
  beforeSend(event, hint) {
    // Ignore errors from browser extension content scripts
    // These typically have filenames like "content-main-world.ts-*.js"
    // and errors like "findFiberByHostInstance is not a function"
    if (event.exception) {
      const error = hint.originalException as Error;
      const frames = event.exception.values?.[0]?.stacktrace?.frames;

      // Check if error is from a browser extension content script
      if (frames) {
        const hasExtensionFrame = frames.some(
          (frame) =>
            frame.filename?.includes("content-main-world") ||
            frame.filename?.includes("extension://") ||
            frame.abs_path?.includes("extension://"),
        );

        if (hasExtensionFrame) {
          return null;
        }
      }

      // Also filter React 19 compatibility errors from extensions
      if (
        error.message?.includes("findFiberByHostInstance") ||
        error.message?.includes("is not a function")
      ) {
        // Only filter if it's not from our app code
        const isFromAppCode = frames?.some(
          (frame) =>
            frame.filename?.startsWith("app:///_next") ||
            frame.filename?.startsWith("webpack://") ||
            frame.in_app === true,
        );

        if (!isFromAppCode) {
          return null;
        }
      }
    }

    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
