"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
// @ts-ignore

import QuoteCard from "@/components/resuable/quote";

import { generateResponse } from "@/lib/ai";
import { storeComponent, updateComponent } from "@/lib/actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

const GenComponent = forwardRef(function GenComponent(
  {
    site_data,
    site_identifier,
    page,
    order,
    component_type,
    setLoading,
  }: {
    site_data: string;
    site_identifier: string;
    page: string;
    order: number;
    component_type: string;
    setLoading: (loading: boolean) => void;
  },
  ref
) {
  const [result, setResult] = useState<any | null>(null);
  const [isLoadingComponent, setIsLoadingComponent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [componentId, setComponentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setIsLoadingComponent(true);
    setError(null);
    try {
      const response = await generateResponse(site_data, component_type);
      setResult(response);
    } catch (err) {
      setError(`Failed to generate component: ${err}`);
    } finally {
      setIsLoadingComponent(false);
      setLoading(false);
    }
  }, [site_data, component_type, setLoading]);

  const regenerateData = async () => {
    setIsRegenerating(true);
    await fetchData();
    setIsRegenerating(false);
  };

  const saveComponent = async () => {
    if (result === null) {
      setError("Cannot save component: props are null");
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("site", site_identifier);
      formData.append("page", page);
      formData.append("component", component_type);
      formData.append("componentOrder", order.toString());
      formData.append("props", JSON.stringify(result));
      const response = await storeComponent(formData);
      if (response.id) {
        setComponentId(response.id);
      }
      setIsSaved(true);
    } catch (err) {
      setError(`Failed to save component: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const updateComponentData = async () => {
    if (result === null) {
      setError("Cannot update component: props are null");
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      if (componentId) {
        formData.append("id", componentId);
      }
      formData.append("site", site_identifier);
      formData.append("page", page);
      formData.append("component", component_type);
      formData.append("props", JSON.stringify(result));
      await updateComponent(formData);
    } catch (err) {
      setError(`Failed to update component: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    saveComponent,
  }));

  useEffect(() => {
    fetchData();
  }, [site_data, component_type, fetchData]);

  const renderComponent = () => {
    switch (component_type) {
      case "header":
        return <Header props={result} />;
      case "hero":
        return <Hero props={result} />;
      case "reviews":
        return <ReviewsComponent props={result} />;
      case "services":
        return <Services props={result} />;
      case "floating-button":
        return <FloatingButton props={result} />;
      case "quote":
        return <QuoteCard props={result} />;
      case "certifications":
        return <CertificationsComponent props={result} />;
      case "newsletter":
        return <NewsletterSignup props={result} />;
      case "faq":
        return <Faq props={result} />;
      case "footer":
        return <Footer props={result} />;
      case "popup":
        return <Popup props={result} />;
      case "meet-us":
        return <MeetUs props={result} />;
      case "floating-button":
        return <FloatingButton props={result} />;
      default:
        return null;
    }
  };

  if (isLoadingComponent) {
    return (
      <Card className="mx-auto mt-10 w-5/6 justify-center p-4">
        <CardHeader>
          <CardTitle className="animate-pulse">
            Generating {component_type}...
          </CardTitle>
          <Button
            onClick={regenerateData}
            disabled={isRegenerating}
            variant="outline"
            className="mt-4"
          >
            {isRegenerating
              ? "Regenerating..."
              : `Regenerate ${component_type}`}
          </Button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-10 w-5/6 justify-center p-4">
      <CardHeader>
        <CardTitle>Generated {component_type}</CardTitle>
        <CardDescription>Order: {order}</CardDescription>
        {error && <p className="text-red-500">{error}</p>}
        {result && renderComponent()}
        <CardFooter className="flex flex-col space-y-2">
          <Collapsible className="w-full">
            <CollapsibleTrigger className="w-full cursor-pointer">
              <Button variant="outline" className="w-full">
                Show/Hide Config
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="mt-4">
                <Editor value={result} onChange={setResult} />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
          <Button
            onClick={fetchData}
            disabled={isLoadingComponent}
            variant="outline"
            className="w-full"
          >
            {isLoadingComponent
              ? "Regenerating..."
              : `Regenerate ${component_type}`}
          </Button>
          {!isSaved ? (
            <Button
              onClick={saveComponent}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? "Saving..." : `Save ${component_type}`}
            </Button>
          ) : (
            <Button
              onClick={updateComponentData}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? "Saving..." : `Update ${component_type}`}
            </Button>
          )}
        </CardFooter>
      </CardHeader>
    </Card>
  );
});

export default GenComponent;
