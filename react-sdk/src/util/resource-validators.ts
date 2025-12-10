import type { ListResourceItem, ResourceSource } from "../model/resource-info";

/**
 * Validates that a ResourceSource has both listResources and getResource defined,
 * or neither defined. You cannot provide one without the other.
 * @param listResources - The listResources function (or undefined)
 * @param getResource - The getResource function (or undefined)
 * @throws {Error} if only one of the functions is provided
 */
export function validateResourceSource(
  listResources: ResourceSource["listResources"] | undefined,
  getResource: ResourceSource["getResource"] | undefined,
): void {
  const hasListResources = listResources != null;
  const hasGetResource = getResource != null;

  if (hasListResources !== hasGetResource) {
    throw new Error(
      "Both listResources and getResource must be provided together, or neither should be provided. " +
        `Got: listResources=${hasListResources ? "defined" : "undefined"}, ` +
        `getResource=${hasGetResource ? "defined" : "undefined"}`,
    );
  }
}

/**
 * Validates that a resource has the required fields.
 * @param resource - The resource to validate
 * @throws {Error} if the resource is missing required fields
 */
export function validateResource(resource: ListResourceItem): void {
  if (!resource.uri) {
    throw new Error("Resource must have a 'uri' field");
  }

  if (!resource.name) {
    throw new Error(
      `Resource with URI '${resource.uri}' must have a 'name' field`,
    );
  }
}
