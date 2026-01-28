import { LeadList } from "@/components/LeadList";
import { MessageThreadFull } from "@/components/ui-registry/MessageThreadFull";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight">TamboCRM</span>
          </div>
          <div>
            <div className="p-4  flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/70">
                  AI Assistant Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1400px] mx-auto">
            <header className="p-8 pb-0">
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                Sales Leads
              </h1>
              <p className="text-white/50">
                Manage and track your AI-generated prospects in real-time.
              </p>
            </header>

            <LeadList />
          </div>
        </div>

        {/* AI Assistant Sidebar */}
        <aside className="w-[400px] border-l border-white/5 bg-[#080808] flex flex-col">
          <div className="flex-1 overflow-hidden">
            <MessageThreadFull />
          </div>
        </aside>
      </div>
    </main>
  );
}
