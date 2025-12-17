/**
 * Resource transformation utilities for converting MCP Resources to AI SDK-compatible content parts.
 *
 * This module handles fetching resources from MCP servers and converting them to formats
 * that can be passed to AI SDK providers (streamText, generateText, etc.).
 */

import {
  ChatCompletionContentPart,
  ChatCompletionContentPartResource,
  ContentPartType,
  Resource,
  ResourceFetcher,
  ResourceFetchResult,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { FilePart, ImagePart, TextPart } from "ai";

/**
 * Represents a successfully fetched and transformed resource
 */
export interface FetchedResourcePart {
  /** The MCP resource that was fetched */
  resource: Resource;
  /** The transformed AI SDK part (TextPart, FilePart, or ImagePart) */
  part: TextPart | FilePart | ImagePart;
}

/**
 * Check if a content part is a resource type that needs transformation
 */
export function isResourceContentPart(
  part: ChatCompletionContentPart,
): part is ChatCompletionContentPartResource {
  return part.type === ContentPartType.Resource;
}

/**
 * Map of serverKey to fetch function.
 * This allows resource transformation to know which MCP server to fetch from.
 */
export type ResourceFetcherMap = Record<string, ResourceFetcher>;

/**
 * Extract serverKey from a resource name (e.g., "github:file" -> "github")
 */
export function extractServerKeyFromResource(resource: Resource): string {
  if (!resource.uri || !resource.uri.includes(":")) {
    throw new Error(`No server key found in resource: ${resource.uri}`);
  }
  return resource.uri.split(":")[0];
}

/**
 * Phase 1: Extract all unique resource URIs that need fetching from messages.
 * Identifies resources with URIs but no cached content and maps them to their fetchers.
 *
 * @param messages - Thread messages potentially containing resources
 * @param resourceFetchers - Map of serverKey to fetch functions
 * @returns Map of URIs to fetch with their associated metadata
 */
function extractUrisToFetch(
  messages: ThreadMessage[],
  resourceFetchers: ResourceFetcherMap,
): Map<
  string,
  {
    uri: string;
    serverKey: string;
    fetchFn: ResourceFetcher;
  }
> {
  const urisToFetch = new Map<
    string,
    {
      uri: string;
      serverKey: string;
      fetchFn: ResourceFetcher;
    }
  >();

  for (const message of messages) {
    if (!Array.isArray(message.content)) {
      continue;
    }

    for (const part of message.content) {
      if (
        part.type !== ContentPartType.Resource ||
        !isResourceContentPart(part)
      ) {
        continue;
      }

      const resource = part.resource;

      // Skip if already has content
      if (resource.text || resource.blob) {
        continue;
      }

      // Skip if no URI to fetch
      if (!resource.uri) {
        continue;
      }

      // Skip if we've already queued this URI
      if (urisToFetch.has(resource.uri)) {
        continue;
      }

      // Find fetcher for this resource's serverKey
      const serverKey = extractServerKeyFromResource(resource);
      const fetchFn = serverKey ? resourceFetchers[serverKey] : undefined;

      if (!fetchFn) {
        console.warn(
          `No fetcher available for resource with serverKey: ${serverKey}`,
        );
        continue;
      }

      urisToFetch.set(resource.uri, { uri: resource.uri, serverKey, fetchFn });
    }
  }

  return urisToFetch;
}

/**
 * Phase 2: Fetch all unique URIs in parallel.
 * Gracefully handles fetch failures without breaking other fetches.
 *
 * @param urisToFetch - Map of URIs to fetch with their metadata
 * @returns Map of successfully fetched content indexed by URI
 */
async function fetchResourceContents(
  urisToFetch: Map<
    string,
    {
      uri: string;
      serverKey: string;
      fetchFn: ResourceFetcher;
    }
  >,
): Promise<Map<string, ResourceFetchResult>> {
  const fetchedContent = new Map<string, ResourceFetchResult>();

  await Promise.all(
    Array.from(urisToFetch.entries()).map(async ([uri, { fetchFn }]) => {
      try {
        const result = await fetchFn(uri);
        if (result.contents.length > 0) {
          fetchedContent.set(uri, result);
        }
      } catch (error) {
        // Make sure not to throw an error here, so we do not break other resource fetches
        console.error(`Error fetching resource ${uri}:`, error);
      }
    }),
  );

  return fetchedContent;
}

/**
 * Phase 3: Apply cached content to messages.
 * Replaces resource parts with fetched content where available.
 *
 * @param messages - Original thread messages
 * @param fetchedContent - Map of fetched content indexed by URI
 * @returns New messages with fetched resources cached as text/blob
 */
function applyCachedContentToMessages(
  messages: ThreadMessage[],
  fetchedContent: Map<string, ResourceFetchResult>,
): ThreadMessage[] {
  return messages.map((message) => {
    if (!Array.isArray(message.content)) {
      return message;
    }

    const transformedContent = message.content.flatMap((part) => {
      if (
        part.type !== ContentPartType.Resource ||
        !isResourceContentPart(part)
      ) {
        return part;
      }

      const resource = part.resource;

      // Skip if already has content
      if (!resource.uri) {
        if (!resource.text || !resource.blob) {
          console.warn(`Resource has no URI`);
        }
        // but I guess we'll return it either way
        return part;
      }
      return convertResourceToContentParts(
        resource,
        fetchedContent.get(resource.uri),
      );
    });

    return {
      ...message,
      content: transformedContent,
    };
  });
}

/**
 * Pre-fetch all resources from thread messages and cache them inline.
 * This converts URI-based resources to cached text/blob resources.
 *
 * Strategy:
 * 1. Extract all unique resource URIs from messages
 * 2. Fetch them in parallel into a map (uri -> content)
 * 3. Apply the map to messages to cache content inline
 *
 * This approach:
 * - Handles duplicates efficiently (fetch once, use many times)
 * - Gracefully handles fetch failures
 * - Keeps async work in one phase, then does synchronous message updates
 *
 * @param messages - Thread messages potentially containing resources
 * @param resourceFetchers - Map of serverKey to fetch functions
 * @returns New messages with fetched resources cached as text/blob
 */
export async function prefetchAndCacheResources(
  messages: ThreadMessage[],
  resourceFetchers: ResourceFetcherMap,
): Promise<ThreadMessage[]> {
  const urisToFetch = extractUrisToFetch(messages, resourceFetchers);
  const fetchedContent = await fetchResourceContents(urisToFetch);
  return applyCachedContentToMessages(messages, fetchedContent);
}

function convertResourceToContentParts(
  resource: Resource,
  resourceContents: ResourceFetchResult | undefined,
): ChatCompletionContentPart[] {
  if (!resourceContents) {
    if (resource.text || resource.blob) {
      return [
        {
          type: ContentPartType.Resource,
          resource,
        },
      ];
    }
    console.warn("no resource contents and no text or blob for ", resource);
    return [];
  }

  return resourceContents.contents.map((content) => {
    return {
      type: ContentPartType.Resource,
      resource: {
        ...resource,
        // content is authoritative, so we override  resource fields with the content
        ...content,
      },
    };
  });
}

/**
 * Extract all Resource content parts from messages for pre-fetching.
 * Useful for identifying which resources need to be fetched upfront.
 */
export function extractResourcesFromMessages(
  messages: ThreadMessage[],
): ChatCompletionContentPartResource[] {
  const resources: ChatCompletionContentPartResource[] = [];

  for (const message of messages) {
    for (const part of message.content) {
      if (isResourceContentPart(part)) {
        resources.push(part);
      }
    }
  }

  return resources;
}
