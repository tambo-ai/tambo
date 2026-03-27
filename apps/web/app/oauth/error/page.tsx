import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function OAuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center px-6 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>OAuth Authorization Failed</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Tambo Cloud could not finish the MCP authorization flow.
          </p>
          {error && (
            <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap break-words">
              {error}
            </pre>
          )}
          <Link className="text-sm underline underline-offset-4" href="/">
            Return to the dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
