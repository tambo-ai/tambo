interface Section {
  heading: string;
  points: string[];
}

interface StructuredOutputData {
  title: string;
  mode: 'simplify' | 'summarize' | 'explain';
  sections: Section[];
  examples: string[];
}

interface StructuredOutputCardsProps {
  data: StructuredOutputData | null;
  isLoading?: boolean;
}

export default function StructuredOutputCards({ data, isLoading }: StructuredOutputCardsProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-32 bg-gray-100 rounded-xl"></div>
        <div className="h-32 bg-gray-100 rounded-xl"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">{data.title}</h2>
          <span className={`
            px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-full
            ${data.mode === 'simplify' ? 'bg-green-100 text-green-800' : ''}
            ${data.mode === 'summarize' ? 'bg-blue-100 text-blue-800' : ''}
            ${data.mode === 'explain' ? 'bg-purple-100 text-purple-800' : ''}
          `}>
            {data.mode}
          </span>
        </div>
      </div>

      <div className="grid gap-6">
        {data.sections.map((section, idx) => (
          <div 
            key={idx}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{section.heading}</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {section.points.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    <span className="text-gray-700 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>


      {data.examples.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
          <h3 className="flex items-center gap-2 text-indigo-900 font-semibold mb-4">
            <span className="text-xl">💡</span> Examples
          </h3>
          <div className="grid gap-3">
            {data.examples.map((example, idx) => (
              <div key={idx} className="bg-white/60 p-3 rounded-lg text-indigo-800 text-sm font-medium border border-indigo-50/50">
                "{example}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
