import Link from "next/link";
import { ArrowRight, Cpu, Zap, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Premium Navigation Header */}
      <nav className="flex items-center justify-between p-6 border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-sm font-bold tracking-tighter uppercase">Hono Intelligence</span>
        </div>
        <Link 
          href="/chat" 
          className="text-xs font-medium px-4 py-2 rounded-full border border-border hover:bg-secondary transition-colors"
        >
          Sign In
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto space-y-12 py-20">
        {/* Hero Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase">
            <Zap className="w-3 h-3" /> Powered by Edge Runtime
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
            Build AI Apps at the <br />
            <span className="text-primary italic">Speed of Thought.</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            A high-performance Hono and Tambo starter kit. Deploy generative UI 
            components globally with zero cold starts.
          </p>
        </div>

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <Link 
            href="/chat" 
            className="group flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Launch Chat Interface <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="https://github.com/tambo-ai/tambo-template" 
            target="_blank"
            className="flex items-center justify-center px-8 py-4 rounded-2xl border border-border bg-card hover:bg-secondary transition-all font-bold"
          >
            View Documentation
          </a>
        </div>

        {/* Feature Grid - Aligned with Tambo Architecture Patterns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="p-6 rounded-3xl border border-border bg-card/50 text-left space-y-3">
            <Cpu className="w-6 h-6 text-primary" />
            <h3 className="font-bold">Generative UI</h3>
            <p className="text-sm text-muted-foreground">AI doesn't just talk; it renders functional React components on the fly.</p>
          </div>
          <div className="p-6 rounded-3xl border border-border bg-card/50 text-left space-y-3">
            <Zap className="w-6 h-6 text-primary" />
            <h3 className="font-bold">Hono Edge</h3>
            <p className="text-sm text-muted-foreground">Sub-millisecond latency with Hono routing on the edge.</p>
          </div>
          <div className="p-6 rounded-3xl border border-border bg-card/50 text-left space-y-3">
            <Shield className="w-6 h-6 text-primary" />
            <h3 className="font-bold">Zod Validation</h3>
            <p className="text-sm text-muted-foreground">Type-safe AI tools and component props via strict Zod schemas.</p>
          </div>
        </div>
      </main>

      <footer className="p-8 border-t border-border text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-50">
          Built for the Tambo Community Standards 2026
        </p>
      </footer>
    </div>
  );
}