import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";
import { vnextDocs, vnextMeta } from "../.source";

export const vnextSource = loader({
  baseUrl: "/vnext",
  source: createMDXSource(vnextDocs, vnextMeta),
});
