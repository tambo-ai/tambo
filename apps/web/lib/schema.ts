import { siteConfig } from "@/lib/config";
import { env } from "@/lib/env";

/**
 * Generates JSON-LD schema markup for the website
 */
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: env.NEXT_PUBLIC_APP_URL || siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${env.NEXT_PUBLIC_APP_URL || siteConfig.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generates JSON-LD schema markup for an organization
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: env.NEXT_PUBLIC_APP_URL || siteConfig.url,
    logo: `${env.NEXT_PUBLIC_APP_URL || siteConfig.url}/api/og`,
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.github,
      siteConfig.links.discord,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: siteConfig.links.email,
      contactType: "customer service",
    },
  };
}

/**
 * Generates JSON-LD schema markup for a product
 */
export function generateProductSchema({
  name,
  description,
  image,
  price,
  currency = "USD",
}: {
  name: string;
  description: string;
  image: string;
  price: string;
  currency?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      url: env.NEXT_PUBLIC_APP_URL || siteConfig.url,
    },
  };
}
