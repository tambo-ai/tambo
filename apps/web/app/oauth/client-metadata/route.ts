import { getBaseUrl } from "@/lib/base-url";
import {
  buildMcpOAuthClientMetadataDocument,
  canUseMcpOAuthClientMetadataUrl,
} from "@tambo-ai-cloud/core";
import { NextResponse } from "next/server";

export function GET() {
  const baseUrl = getBaseUrl();

  if (!baseUrl || !canUseMcpOAuthClientMetadataUrl(baseUrl)) {
    return NextResponse.json(
      { error: "MCP OAuth client metadata is only served over HTTPS" },
      { status: 404 },
    );
  }

  return NextResponse.json(buildMcpOAuthClientMetadataDocument({ baseUrl }), {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
