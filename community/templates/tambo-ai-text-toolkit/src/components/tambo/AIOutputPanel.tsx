interface AIOutputPanelProps {
  content: string;
  action: string;
}

export default function AIOutputPanel({ content, action }: AIOutputPanelProps) {
  const actionLabels: Record<string, string> = {
    explain: 'Explanation',
    summarize: 'Summary',
    simplify: 'Simplified Version',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <h2 className="text-lg font-semibold text-gray-900">
          {actionLabels[action] || 'AI Output'} (Powered by Tambo)
        </h2>
      </div>
      <div className="prose max-w-none">
        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
}
