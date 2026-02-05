const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.tambo.co";
const mainSiteUrl = "https://tambo.co";

type JsonLdProps = {
  readonly id: string;
  readonly schema: unknown;
};

export function JsonLd({ id, schema }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Organization schema for Tambo AI brand identity.
 */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tambo AI",
  url: mainSiteUrl,
  logo: `${mainSiteUrl}/logo.png`,
  description:
    "Tambo is a generative UI SDK for React that lets AI dynamically render components based on natural language conversations.",
  sameAs: [
    "https://github.com/tambo-ai/tambo",
    "https://x.com/tamaborino",
    "https://discord.gg/wMprBWYfbb",
  ],
  foundingDate: "2024",
  knowsAbout: [
    "Generative UI",
    "React SDK",
    "Model Context Protocol",
    "AI-powered interfaces",
    "Component rendering",
  ],
};

/**
 * SoftwareApplication schema for the Tambo React SDK.
 */
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tambo React SDK",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  description:
    "Open-source React SDK for building generative UI applications. Register components once, let AI render them dynamically based on user messages.",
  url: mainSiteUrl,
  downloadUrl: "https://www.npmjs.com/package/@tambo-ai/react",
  softwareVersion: "1.0",
  author: {
    "@type": "Organization",
    name: "Tambo AI",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  programmingLanguage: ["TypeScript", "JavaScript"],
  runtimePlatform: "Node.js",
  keywords: [
    "generative UI",
    "React",
    "AI",
    "MCP",
    "Model Context Protocol",
    "component rendering",
    "streaming",
    "tools",
  ],
};

/**
 * WebSite schema with search action for the documentation site.
 */
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Tambo AI Documentation",
  url: baseUrl,
  description:
    "Official documentation for Tambo - the generative UI SDK for React with MCP-native tools, streaming components, and AI-powered interfaces.",
  publisher: {
    "@type": "Organization",
    name: "Tambo AI",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${baseUrl}?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

/**
 * TechArticle schema for documentation pages.
 */
export function createDocPageSchema({
  title,
  description,
  url,
  dateModified,
}: {
  title: string;
  description: string;
  url: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    description,
    url,
    ...(dateModified ? { dateModified } : {}),
    author: {
      "@type": "Organization",
      name: "Tambo AI",
    },
    publisher: {
      "@type": "Organization",
      name: "Tambo AI",
      logo: {
        "@type": "ImageObject",
        url: `${mainSiteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

/**
 * FAQPage schema for pages with Q&A content.
 */
export function createFAQSchema(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * HowTo schema for tutorial/guide pages.
 */
export function createHowToSchema({
  name,
  description,
  steps,
  totalTime,
}: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string }>;
  totalTime?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    totalTime: totalTime ?? "PT10M",
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

/**
 * Renders global JSON-LD schemas for the entire site.
 * Place this in the root layout.
 */
export function GlobalJsonLd() {
  const schemas = [organizationSchema, softwareSchema, websiteSchema];

  return <JsonLd id="global-json-ld" schema={schemas} />;
}

/**
 * Renders page-specific JSON-LD schema.
 */
export function PageJsonLd({
  id = "page-json-ld",
  schema,
}: {
  id?: string;
  schema: unknown;
}) {
  return <JsonLd id={id} schema={schema} />;
}
