import { ContextHelperFn } from "./types";

export const currentTimeContextHelper: ContextHelperFn = () => {
  try {
    const now = new Date();
    return { timestamp: now.toString() };
  } catch (e) {
    console.error("prebuiltUserTime failed:", e);
    return null;
  }
};

