import { useTamboContext } from "../provider";

/**
 * Core hook to access the Tambo client in React Native.
 */
export function useTambo() {
  const { client } = useTamboContext();
  return { client };
}
