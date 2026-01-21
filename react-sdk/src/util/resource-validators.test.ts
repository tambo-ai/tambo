import type { ListResourceItem } from "../model/resource-info";
import {
  validateResource,
  validateResourceSource,
} from "./resource-validators";

describe("validateResourceSource", () => {
  it("should throw when has listResources but not getResource", () => {
    const listResources = async () => [];
    const getResource = undefined;

    expect(() => {
      validateResourceSource(listResources, getResource);
    }).toThrow(
      "Both listResources and getResource must be provided together, or neither should be provided. " +
        "Got: listResources=defined, getResource=undefined",
    );
  });

  it("should throw when has getResource but not listResources", () => {
    const listResources = undefined;
    const getResource = async () => ({
      contents: [
        {
          uri: "https://resource",
          mimeType: "text/plain",
          text: "test",
        },
      ],
    });

    expect(() => {
      validateResourceSource(listResources, getResource);
    }).toThrow(
      "Both listResources and getResource must be provided together, or neither should be provided. " +
        "Got: listResources=undefined, getResource=defined",
    );
  });

  it("should not throw when both listResources and getResource are provided", () => {
    const listResources = async () => [];
    const getResource = async () => ({
      contents: [
        {
          uri: "https://resource",
          mimeType: "text/plain",
          text: "test",
        },
      ],
    });

    expect(() => {
      validateResourceSource(listResources, getResource);
    }).not.toThrow();
  });

  it("should not throw when neither listResources nor getResource are provided", () => {
    const listResources = undefined;
    const getResource = undefined;

    expect(() => {
      validateResourceSource(listResources, getResource);
    }).not.toThrow();
  });
});

describe("validateResource", () => {
  it("should throw when resource is missing uri field", () => {
    const resource = {
      name: "Test Resource",
    } as ListResourceItem;

    expect(() => {
      validateResource(resource);
    }).toThrow("Resource must have a 'uri' field");
  });

  it("should throw when resource is missing name field", () => {
    const resource = {
      uri: "https://resource",
    } as ListResourceItem;

    expect(() => {
      validateResource(resource);
    }).toThrow("Resource with URI 'https://resource' must have a 'name' field");
  });

  it("should not throw when resource has both uri and name fields", () => {
    const resource: ListResourceItem = {
      uri: "https://resource",
      name: "Test Resource",
    };

    expect(() => {
      validateResource(resource);
    }).not.toThrow();
  });

  it("should not throw when resource has uri, name, and optional fields", () => {
    const resource: ListResourceItem = {
      uri: "https://resource",
      name: "Test Resource",
      description: "A test resource",
      mimeType: "text/plain",
    };

    expect(() => {
      validateResource(resource);
    }).not.toThrow();
  });
});
