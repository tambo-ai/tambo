export const getProductHuntUrl = () =>
  process.env.NEXT_PUBLIC_PRODUCT_HUNT_URL ??
  "https://www.producthunt.com/products/tambo";

export const PRODUCT_HUNT_BANNER_DISMISS_KEY =
  "product_hunt_banner_dismissed_session";
export const PRODUCT_HUNT_BUBBLE_DISMISS_KEY =
  "product_hunt_thought_bubble_dismissed_session";
