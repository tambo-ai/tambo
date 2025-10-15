import isEqual from "react-fast-compare";
/**
 * The interval at which to send updates to the client.
 *
 * This is to avoid sending too many updates to the client, which can cause
 * performance issues.
 */
const STREAMING_UPDATE_INTERVAL_MS = 50;

/**
 * Throttle the stream to avoid sending too many updates to the client.
 * Implement shouldForceYield when you want to force a chunk to be yielded, even
 * if it's within the default interval. For example, if you want to force a
 * yield every time the item.id changes to make sure you always get the first
 * item of each new id in the stream.
 *
 * @param stream The stream to throttle.
 * @param shouldForceYield A function that returns true if the chunk should be
 *   yielded immediately, false otherwise.
 */
export async function* throttleChunks<T>(
  stream: AsyncIterableIterator<T>,
  shouldForceYield?: (t1: T, t2: T) => boolean,
): AsyncIterableIterator<T> {
  let lastYieldedChunk: T | undefined = undefined;
  let lastChunk: T | undefined = undefined;
  // Start at 0 to make sure the first chunk is yielded immediately
  let lastUpdateTime = 0;
  for await (const chunk of stream) {
    // Save in case we need to yield the last chunk
    lastChunk = chunk;

    // Make sure not to yield duplicate chunks, just a waste of bandwidth
    if (lastYieldedChunk !== undefined && isEqual(chunk, lastYieldedChunk)) {
      continue;
    }

    // Throttle the stream to avoid sending too many updates to the client
    const currentTime = Date.now();
    const shouldYield =
      !lastYieldedChunk || shouldForceYield?.(lastYieldedChunk, chunk);
    if (
      !shouldYield &&
      currentTime - lastUpdateTime < STREAMING_UPDATE_INTERVAL_MS
    ) {
      continue;
    }
    lastUpdateTime = currentTime;
    lastYieldedChunk = chunk;
    yield chunk;
  }
  // The last chunk may have been skipped due to throttling, so we yield it if
  // it's different from the last yielded chunk. Note that we do not need deep
  // equality here because the only real reason to emit here is because of
  // throttling so we're virtually guaranteed to have a different chunk.
  if (lastChunk !== undefined && lastChunk !== lastYieldedChunk) {
    yield lastChunk;
  }
}
