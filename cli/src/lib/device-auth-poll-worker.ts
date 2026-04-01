/**
 * Background polling worker for device auth.
 *
 * Spawned as a detached child process by runDeviceAuthFlow when running in
 * non-interactive mode (agents/CI). Polls the device auth endpoint until the
 * user authenticates, then saves the token to disk and exits.
 *
 * Usage: node device-auth-poll-worker.js <deviceCode> <intervalSeconds>
 */
import { api, ApiError } from "./api-client.js";
import {
  saveToken,
  setInMemoryToken,
  type StoredToken,
} from "./token-storage.js";

const [deviceCode, intervalStr] = process.argv.slice(2);

if (!deviceCode) {
  process.exit(1);
}

const pollIntervalMs = (Number(intervalStr) || 5) * 1000;
const maxAttempts = 180;

async function poll(): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    try {
      const response = await api.deviceAuth.poll.query({ deviceCode });

      if (
        response.status === "complete" &&
        response.sessionToken &&
        response.expiresAt
      ) {
        // Temporarily set in-memory token to fetch user info
        setInMemoryToken(response.sessionToken);

        try {
          const userInfo = await api.user.getUser.query();

          const tokenData: StoredToken = {
            sessionToken: response.sessionToken,
            expiresAt: response.expiresAt,
            user: {
              id: userInfo.id,
              email: userInfo.email,
              name: userInfo.name,
            },
            storedAt: new Date().toISOString(),
          };

          await saveToken(tokenData);
        } finally {
          setInMemoryToken(null);
        }

        process.exit(0);
      }

      if (response.status === "expired") {
        process.exit(1);
      }
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.statusCode !== undefined &&
        error.statusCode >= 400 &&
        error.statusCode < 500 &&
        error.statusCode !== 429
      ) {
        process.exit(1);
      }
      // Retryable error, continue polling
    }
  }

  // Timed out
  process.exit(1);
}

void poll();
