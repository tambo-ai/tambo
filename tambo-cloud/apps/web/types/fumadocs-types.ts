import { TableOfContents } from "fumadocs-core/server";
import "fumadocs-core/source";

// Manually extend the PageData type to include the body as a React component,
// to fix some strange typing issues with the various fumadocs packages

declare module "fumadocs-core/source" {
  interface PageData {
    title: string;
    description?: string;
    body: React.FC<any>;
    toc: TableOfContents;
    full?: boolean;
  }
}
