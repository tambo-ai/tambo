"use client";

import { EmailDialog } from "@/components/email-dialog";
import { Button } from "@/components/ui/button";
import HeroVideoDialog from "@/components/ui/hero-video-dialog";
import { ArrowRight, BarChart3, Brain, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg bg-background/50 backdrop-blur-sm border border-border">
      <div className="p-3 rounded-full bg-primary/10 mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function AnalyticsDemoContent() {
  const searchParams = useSearchParams();
  const companyName = searchParams.get("company");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center gap-8 p-4 py-20 bg-gradient-to-b from-background to-background/50">
        {companyName ? (
          <h1 className="text-5xl font-bold text-center max-w-4xl">
            <div className="mb-4">
              Welcome <span className="text-primary">{companyName}</span>!
            </div>
            <div>Transform Your Data into AI-Powered Insights</div>
          </h1>
        ) : (
          <h1 className="text-5xl font-bold text-center max-w-4xl">
            Transform Your Data into AI-Powered Insights
          </h1>
        )}

        <p className="text-xl text-muted-foreground text-center max-w-2xl mb-8">
          Build sophisticated analytics dashboards with natural language
          processing in minutes, not months.
        </p>

        <div className="flex gap-4 mb-12">
          <Button
            size="lg"
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-lg font-medium text-white shadow transition-colors hover:bg-primary/90"
          >
            Request Early Access
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="w-full max-w-4xl">
          <HeroVideoDialog
            videoSrc="/videos/canvas-demo.mp4"
            className="w-full shadow-2xl rounded-3xl border border-border"
            animationStyle="from-bottom"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Why Choose Tambo Analytics?
          </h2>
          <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Powerful features that make data analysis accessible to everyone in
            your organization
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Feature
              icon={Brain}
              title="AI-Powered Analysis"
              description="Let AI do the heavy lifting. Ask questions in plain English and get instant insights from your data."
            />
            <Feature
              icon={Zap}
              title="Lightning Fast Setup"
              description="Connect your data sources and start analyzing in minutes. No complex configurations required."
            />
            <Feature
              icon={BarChart3}
              title="Real-time Dashboards"
              description="Create beautiful, interactive dashboards that update in real-time as your data changes."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Analytics?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the waitlist today and be among the first to experience the
            future of data analytics.
          </p>
          <Button
            size="lg"
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-lg font-medium text-white shadow transition-colors hover:bg-primary/90"
          >
            Request Early Access
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <EmailDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </main>
  );
}

export default function AnalyticsDemoPage() {
  return (
    <Suspense>
      <AnalyticsDemoContent />
    </Suspense>
  );
}
