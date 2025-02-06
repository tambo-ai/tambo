import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";
import { mainDocs, mainMeta } from "../.source";

export const source = loader({
  baseUrl: "/docs",
  source: createMDXSource(mainDocs, mainMeta),
});
