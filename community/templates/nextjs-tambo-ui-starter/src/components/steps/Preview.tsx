'use client';

import { TemplateConfig } from '@/app/page';

interface PreviewProps {
  config: TemplateConfig;
}

export default function Preview({ config }: PreviewProps) {
  const getTechStackSummary = () => {
    const stack: string[] = [];
    if (config.styling) stack.push(config.styling);
    if (config.auth && config.auth !== 'none') stack.push(config.auth);
    if (config.database && config.database !== 'none') stack.push(config.database);
    return stack;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Your Template</h2>
        <p className="text-slate-600">
          Here&apos;s what will be generated. Make sure everything looks correct before proceeding.
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-xl font-bold text-blue-900 mb-4">
          {config.name || 'your-template-name'}
        </h3>
        <p className="text-blue-800 mb-4">
          {config.description || 'A Tambo template for...'}
        </p>
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <span className="bg-blue-100 px-2 py-1 rounded">by {config.author || 'Author'}</span>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          Tech Stack
        </h3>
        <div className="flex flex-wrap gap-2">
          {getTechStackSummary().map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
            >
              {tech}
            </span>
          ))}
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Tambo
          </span>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          Tambo Integration
        </h3>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-slate-700">Focus</div>
            <div className="text-slate-900">{config.integrationFocus || 'Not specified'}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-700">Example Component</div>
            <div className="text-slate-900">{config.exampleComponent || 'Not specified'}</div>
          </div>
          {config.componentDescription && (
            <div>
              <div className="text-sm font-medium text-slate-700">Description</div>
              <div className="text-slate-900">{config.componentDescription}</div>
            </div>
          )}
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          What Will Be Generated
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Complete {config.framework} project structure</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>package.json with all dependencies</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>TypeScript configuration with strict mode</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>ESLint and Prettier configuration</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>{config.styling} styling setup</span>
          </div>
          {config.auth && config.auth !== 'none' && (
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>{config.auth} authentication integration</span>
            </div>
          )}
          {config.database && config.database !== 'none' && (
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>{config.database} database setup</span>
            </div>
          )}
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Example Tambo component: {config.exampleComponent}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Comprehensive README with setup instructions</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>.env.example file with required environment variables</span>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span>📁</span> Folder Structure
        </h3>
        <pre className="text-sm text-slate-700 font-mono overflow-x-auto">
{`${config.name || 'your-template'}/
├── README.md
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .env.example
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── tambo/
│   │       └── ${config.exampleComponent || 'YourComponent'}.tsx
│   └── lib/
│       └── tambo.ts
└── public/`}
        </pre>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Next Steps After Download</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Extract the generated ZIP file</li>
              <li>Run <code className="bg-blue-100 px-1 rounded">npm install</code></li>
              <li>Set up environment variables in .env</li>
              <li>Run <code className="bg-blue-100 px-1 rounded">npm run dev</code> to test</li>
              <li>Record a video demo showing the Tambo integration</li>
              <li>Add the template to community/templates/ in Tambo repo</li>
              <li>Submit a PR with your template and video link</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}