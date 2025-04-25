/**
 * Component to preload critical resources for better Core Web Vitals
 * Improves LCP (Largest Contentful Paint) by preloading critical images
 * Improves FID (First Input Delay) by preloading critical scripts
 */
export function PreloadResources() {
  return (
    <>
      {/* Preload logo image for faster LCP */}
      <link rel="preload" href="/favicon.ico" as="image" type="image/x-icon" />

      {/* Preload critical fonts */}
      <link
        rel="preload"
        href="/assets/fonts/sentient-light/Sentient-Light.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />

      {/* Preload hero image if on homepage */}
      <link
        rel="preload"
        href="/assets/landing/hero/OCTO-GRAY-6.svg"
        as="image"
        type="image/svg+xml"
      />

      {/* DNS prefetch for third-party domains */}
      <link rel="dns-prefetch" href="https://app.posthog.com" />
      <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
    </>
  );
}
