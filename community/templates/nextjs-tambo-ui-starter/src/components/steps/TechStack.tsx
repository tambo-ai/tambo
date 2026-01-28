'use client';

import { TemplateConfig } from '@/app/page';

interface TechStackProps {
  config: TemplateConfig;
  updateConfig: (updates: Partial<TemplateConfig>) => void;
}

const frameworks = [
  { id: 'nextjs', name: 'Next.js', description: 'React framework with App Router' },
  { id: 'remix', name: 'Remix', description: 'Full-stack React framework' },
  { id: 'vite', name: 'Vite + React', description: 'Fast build tool with React' },
  { id: 'expo', name: 'Expo', description: 'React Native framework' },
  { id: 'astro', name: 'Astro', description: 'Content-focused framework' },
];

const stylingOptions = [
  { id: 'tailwind', name: 'Tailwind CSS', description: 'Utility-first CSS framework' },
  { id: 'css-modules', name: 'CSS Modules', description: 'Scoped CSS files' },
  { id: 'styled-components', name: 'Styled Components', description: 'CSS-in-JS solution' },
];

const authOptions = [
  { id: 'none', name: 'No Auth', description: 'Skip authentication' },
  { id: 'clerk', name: 'Clerk', description: 'Complete auth solution' },
  { id: 'supabase', name: 'Supabase Auth', description: 'Open source auth' },
  { id: 'nextauth', name: 'NextAuth.js', description: 'Auth for Next.js' },
];

const databaseOptions = [
  { id: 'none', name: 'No Database', description: 'Skip database setup' },
  { id: 'prisma', name: 'Prisma', description: 'Next-gen ORM' },
  { id: 'drizzle', name: 'Drizzle', description: 'TypeScript ORM' },
  { id: 'supabase', name: 'Supabase DB', description: 'PostgreSQL database' },
];

export default function TechStack({ config, updateConfig }: TechStackProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Tech Stack</h2>
        <p className="text-slate-600">
          Choose your framework and core technologies. Keep it focused - 1-3 technologies is ideal.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Framework <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {frameworks.map((framework) => (
            <button
              key={framework.id}
              onClick={() =>
                updateConfig({
                  framework: framework.id as 'nextjs' | 'remix' | 'vite' | 'expo' | 'astro',
                })
              }
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                config.framework === framework.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900">{framework.name}</div>
                <div className="text-sm text-slate-600">{framework.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Styling <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {stylingOptions.map((option) => (
            <button
              key={option.id}
              onClick={() =>
                updateConfig({
                  styling: option.id as 'tailwind' | 'css-modules' | 'styled-components',
                })
              }
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                config.styling === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900 mb-1">{option.name}</div>
                <div className="text-sm text-slate-600">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Authentication (Optional)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {authOptions.map((option) => (
            <button
              key={option.id}
              onClick={() =>
                updateConfig({
                  auth: option.id as 'none' | 'clerk' | 'supabase' | 'nextauth',
                })
              }
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                config.auth === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900 mb-1">{option.name}</div>
                <div className="text-sm text-slate-600">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">Database (Optional)</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {databaseOptions.map((option) => (
            <button
              key={option.id}
              onClick={() =>
                updateConfig({
                  database: option.id as 'none' | 'prisma' | 'drizzle' | 'supabase',
                })
              }
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                config.database === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900 mb-1">{option.name}</div>
                <div className="text-sm text-slate-600">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div>
          <h4 className="font-semibold text-amber-900 mb-1">Keep It Simple</h4>
          <p className="text-sm text-amber-800">
            Templates with 1-3 technologies perform best. Choose ONE tool per job - one auth
            provider, one database, one styling solution. Kitchen-sink templates get rejected.
          </p>
        </div>
      </div>
    </div>
  );
}
