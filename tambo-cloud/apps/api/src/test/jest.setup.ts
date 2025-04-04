// Global mock for superjson (ESM module)
jest.mock("superjson", () => ({
  default: {
    parse: jest.fn((str) => {
      return JSON.parse(str);
    }),
    stringify: jest.fn((obj) => JSON.stringify(obj)),
    serialize: jest.fn((obj) => ({ json: JSON.stringify(obj) })),
    deserialize: jest.fn(({ json }) => {
      try {
        return JSON.parse(json);
      } catch (_e) {
        return json;
      }
    }),
  },
}));
