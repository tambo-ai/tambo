"use client";

import React, { useRef, useState } from "react";
import GenComponent from "@/components/sitegen/gen-component";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
const origin = process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000";

const generateSiteIdentifier = (url: string): string => {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  const parts = hostname.split(".").filter((part) => part !== "www");
  return parts.join("");
};
interface ComponentRef {
  saveComponent?: () => Promise<void>;
}

const componentTypes = [{ type: "quote", order: 6 }];
const page = "landing";

export default function GenLanding({
  site_url,
  site_data,
  setLoading,
}: {
  site_url: string;
  site_data: string;
  setLoading: (loading: boolean) => void;
}) {
  const componentRefs = useRef<ComponentRef[]>([]);
  const [showLink, setShowLink] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [componentsGenerated, setComponentsGenerated] = useState(false);
  const [generatedComponents, setGeneratedComponents] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const saveAllComponents = async () => {
    setIsSavingAll(true);
    for (const ref of componentRefs.current) {
      if (ref && ref.saveComponent) {
        await ref.saveComponent();
      }
    }
    setShowLink(true);
    setIsSavingAll(false);
  };

  const generateComponents = async () => {
    setIsGenerating(true);
    for (let i = 0; i < componentTypes.length; i++) {
      setGeneratedComponents((prev) => prev + 1);
    }
    setComponentsGenerated(true);
    setIsGenerating(false);
  };
  const siteIdentifier = generateSiteIdentifier(site_url);
  return (
    <>
      <Card className="mx-auto mt-10 w-5/6 justify-center p-4">
        <CardHeader>
          <CardTitle>Generate New Landing Page</CardTitle>
        </CardHeader>
        <div className="flex w-full flex-col space-y-4">
          <Button
            onClick={generateComponents}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? "Creating Components..." : "Create Components"}
          </Button>
          <Button
            onClick={saveAllComponents}
            disabled={isSavingAll || !componentsGenerated}
            className="w-full"
          >
            {isSavingAll ? "Saving All..." : "Save All Components"}
          </Button>
        </div>
        {showLink && (
          <div>
            <a
              href={`/sites/v1/${siteIdentifier}/${page}`}
              className="text-black underline hover:text-gray-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              See the site at {origin}/sites/v1/{siteIdentifier}/{page}
            </a>
          </div>
        )}
      </Card>
      {componentsGenerated &&
        componentTypes
          .slice(0, generatedComponents)
          .map(({ type, order }, index) => (
            <GenComponent
              key={type}
              ref={(el) => {
                componentRefs.current[index] = el as ComponentRef;
              }}
              site_identifier={siteIdentifier}
              page={page}
              order={order}
              component_type={type}
              site_data={site_data}
              setLoading={setLoading}
            />
          ))}
    </>
  );
}
