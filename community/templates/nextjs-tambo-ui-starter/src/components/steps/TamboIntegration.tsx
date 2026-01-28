'use client';

import { TemplateConfig } from '@/app/page';

interface TamboIntegrationProps {
  config: TemplateConfig;
  updateConfig: (updates: Partial<TemplateConfig>) => void;
}

const integrationOptions = [
  {
    id: 'components',
    name: 'Component Focus',
    icon: '',
    description: 'Show how to create reusable UI components with Tambo',
    example: 'MetricCard, DataTable, ChartWidget',
  },
  {
    id: 'tools',
    name: 'Tool Focus',
    icon: '',
    description: 'Demonstrate Tambo tools integration',
    example: 'Database queries, API calls, file operations',
  },
  {
    id: 'both',
    name: 'Components + Tools',
    icon: '',
    description: 'Show both component creation and tool usage',
    example: 'Components that fetch data using tools',
  },
];

const componentExamples = [
  { name: 'MetricCard', desc: 'Display key metrics with icons and trends' },
  { name: 'UserProfile', desc: 'Show user information with auth integration' },
  { name: 'DataTable', desc: 'Sortable table with database integration' },
  { name: 'ChartWidget', desc: 'Data visualization component' },
  { name: 'TodoList', desc: 'Interactive list with CRUD operations' },
  { name: 'CustomComponent', desc: 'Create your own example' },
];

export default function TamboIntegration({ config, updateConfig }: TamboIntegrationProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Tambo Integration</h2>
        <p className="text-slate-600">
          Define what your template will demonstrate. You only need ONE working example - quality
          over quantity.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          What will your template demonstrate? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-3">
          {integrationOptions.map((option) => (
            <button
              key={option.id}
              onClick={() =>
                updateConfig({
                  integrationFocus: option.id as 'components' | 'tools' | 'both',
                })
              }
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                config.integrationFocus === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{option.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 mb-1">{option.name}</div>
                  <div className="text-sm text-slate-600 mb-2">{option.description}</div>
                  <div className="text-xs text-slate-500 bg-slate-100 rounded px-2 py-1 inline-block">
                    Example: {option.example}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Example Component Name <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          {componentExamples.map((example) => (
            <button
              key={example.name}
              onClick={() => updateConfig({ exampleComponent: example.name })}
              className={`p-3 border-2 rounded-lg text-left transition-all ${
                config.exampleComponent === example.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-medium text-slate-900 text-sm mb-1">{example.name}</div>
              <div className="text-xs text-slate-600">{example.desc}</div>
            </button>
          ))}
        </div>
        <input
          type="text"
          value={config.exampleComponent}
          onChange={(e) => updateConfig({ exampleComponent: e.target.value })}
          placeholder="Or enter custom component name..."
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Component Description
        </label>
        <textarea
          value={config.componentDescription}
          onChange={(e) => updateConfig({ componentDescription: e.target.value })}
          placeholder="Describe what this component does and how it uses Tambo..."
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-slate-500">
          This will be used in your component&apos;s documentation and props schema description.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div>
            <h4 className="font-semibold text-green-900 mb-2">Quality Requirements</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Your example must actually work - no placeholder code</li>
              <li>• Use proper Tambo component registration with clear descriptions</li>
              <li>• Include Zod schemas for props validation</li>
              <li>• Component should render correctly in the AI chat interface</li>
              <li>• No workarounds - use Tambo&apos;s APIs correctly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
