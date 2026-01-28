'use client';

import { TemplateConfig } from '@/app/page';

interface TemplateBasicsProps {
  config: TemplateConfig;
  updateConfig: (updates: Partial<TemplateConfig>) => void;
}

export default function TemplateBasics({ config, updateConfig }: TemplateBasicsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Template Basics</h2>
        <p className="text-slate-600">
          Let&apos;s start with the fundamentals. This information will be used in your README and
          package.json.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Template Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => updateConfig({ name: e.target.value })}
            placeholder="e.g., nextjs-clerk-starter"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-slate-500">
            Use lowercase with hyphens. This will be your folder name.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            One-line Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={config.description}
            onChange={(e) => updateConfig({ description: e.target.value })}
            placeholder="e.g., A Next.js starter with Clerk authentication and Tambo AI"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-slate-500">
            Keep it concise. This appears in the template README and repository listing.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Author Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={config.author}
            onChange={(e) => updateConfig({ author: e.target.value })}
            placeholder="e.g., Your Name or @yourusername"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-slate-500">
            Your name or GitHub username for attribution.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">Template Naming Tips</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>
                  • Use the format:{' '}
                  <code className="bg-amber-100 px-1 rounded">framework-integration-purpose</code>
                </li>
                <li>
                  • Example: <code className="bg-amber-100 px-1 rounded">remix-clerk-starter</code>
                </li>
                <li>• Keep it descriptive but concise (max 3-4 words)</li>
                <li>
                  • Avoid generic names like &quot;tambo-template&quot; or &quot;my-template&quot;
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
