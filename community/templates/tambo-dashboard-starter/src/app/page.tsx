'use client';
import { useTamboThread } from "@tambo-ai/react";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { thread } = useTamboThread();
  const [allCharts, setAllCharts] = useState<any[]>([]);

  // Collect ALL charts from thread
  useEffect(() => {
    if (thread?.messages && thread.messages.length > 0) {
      const charts = thread.messages
        .filter(msg => msg.renderedComponent)
        .map(msg => ({
          id: msg.id,
          component: msg.renderedComponent,
        }));
      
      setAllCharts(charts);
    }
  }, [thread?.messages]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT: Tambo AI Chat */}
      <div className="w-[480px] bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 border-b border-gray-200 flex items-center px-6">
          <h2 className="font-semibold text-gray-900">Tambo AI</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <MessageThreadFull />
        </div>
      </div>

      {/* RIGHT: Dashboard */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        
        <div className="flex-1 overflow-auto p-8">
          {allCharts.length === 0 ? (
            <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-lg font-medium mb-2">Ask the AI to generate charts or visualizations</p>
                <p className="text-sm text-gray-500">Try: "Show a bar chart of population by year"</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {allCharts.map(chart => (
                <div 
                  key={chart.id} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-center"
                >
                  {chart.component}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}