import { ContextHelperFn } from "./types";

export const currentPageContextHelper: ContextHelperFn = () => {
  try {
    if (typeof window === "undefined") return null;
    return { url: window.location.href, title: document.title };
  } catch (e) {
    console.error("prebuiltUserPage failed:", e);
    return null;
  }
};

