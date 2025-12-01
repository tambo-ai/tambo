export const env = new Proxy(
  {},
  {
    get: () => undefined,
  },
);
