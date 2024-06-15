"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import dynamic from "next/dynamic";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { marked } from "marked";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import { Page } from "@/app/api/crawl/crawler";

const GenLanding = dynamic(() => import("@/components/sitegen/gen-landing"), {
  ssr: false,
});

const formSchema = z.object({
  url: z.string().url({ message: "Invalid URL" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CrawlerInput() {
  const [crawlResult, setCrawlResult] = useState<Page[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const [extractedData, setExtractedData] = useState<string>("");
  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  const handleCrawl = async (url: string) => {
    setCrawlResult([]);
    setExtractedData("");
    try {
      const response = await fetch(`/api/crawl?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error("Failed to crawl the URL");
      }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Crawled data is empty or invalid");
      }
      data.forEach((page: Page) => {
        const urlObj = new URL(page.url);
        const rootDomain = `${urlObj.protocol}//${urlObj.hostname}`;
        page.markdownContent = page.markdownContent;
      });
      setCrawlResult(data);
      setSubmitSuccess(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setCrawlResult([
          {
            url: "",
            markdownContent: `Error: ${error.message}`,
            htmlContent: "",
          },
        ]);
      } else {
        setCrawlResult([
          {
            url: "",
            markdownContent: "An unknown error occurred",
            htmlContent: "",
          },
        ]);
      }
      setSubmitSuccess(false);
      setSubmitting(false);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    await handleCrawl(values.url);
  };

  const handleExtractData = async () => {
    setExtractedData("");
    setExtracting(true); // Set extracting to true when extraction starts
    const response = await fetch("/api/generate/unlimited", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bot: "extractorV2",
        prompt: crawlResult
          .map((result) => result.markdownContent)
          .reverse()
          .join(" "),
      }),
    });

    if (response.ok) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let extractedText = "";

      while (true) {
        const { done, value } = await reader?.read()!;
        if (done) break;
        extractedText += decoder.decode(value, { stream: true });
        setExtractedData(
          (prev) => prev + decoder.decode(value, { stream: true }),
        );
      }

      console.log("Extracted Data:", extractedText);
    } else {
      console.error("Failed to extract data");
    }
    setExtracting(false);
  };

  return (
    <>
      <Card className="mx-auto mt-10 w-5/6 justify-center p-4">
        <CardHeader>
          <CardTitle>Site to Redesign</CardTitle>
          <CardDescription>
            Enter the URL to extract the content of the site.
          </CardDescription>
        </CardHeader>
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the URL" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter a valid URL to crawl.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Crawling..." : "Crawl URL"}
              </Button>
              {submitSuccess === false && (
                <div className="mt-4 rounded border border-red-400 bg-red-100 p-4 text-center text-red-700">
                  <p className="font-bold">Error</p>
                  <p>There was an error crawling the URL. Please try again.</p>
                </div>
              )}
            </form>
          </Form>
          {crawlResult.length > 0 && (
            <Card>
              {crawlResult.map((result, index) => (
                <div className="mb-4" key={index}>
                  <h2 className="text-lg font-bold">Page: {result.url}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: marked(result.markdownContent || ""),
                    }}
                  />
                </div>
              ))}
            </Card>
          )}
        </div>
      </Card>
      {crawlResult.length > 0 && (
        <Card className="mx-auto mt-10 w-5/6 justify-center p-4">
          <CardHeader>
            <CardTitle>Summarize Key Site Data</CardTitle>
          </CardHeader>
          <Button
            type="button"
            onClick={handleExtractData}
            disabled={extracting}
            className="mt-4 w-full"
          >
            {extracting ? "Summarizing..." : "Summarize Data"}
          </Button>
        </Card>
      )}
      {extractedData && (
        <Card className="mx-auto mt-10 w-5/6 justify-center p-4">
          <CardHeader>
            <CardTitle>Summarized Data </CardTitle>
          </CardHeader>
          <div className="overflow-auto p-4">
            <pre className="whitespace-pre-wrap break-words">
              {extractedData}
            </pre>
          </div>
        </Card>
      )}
      {extractedData && (
        <GenLanding
          site_data={extractedData}
          setLoading={setLoading}
          site_url={crawlResult[0].url}
        />
      )}
    </>
  );
}
