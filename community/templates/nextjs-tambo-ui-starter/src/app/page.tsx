
'use client';

import { useState } from 'react';
import StepIndicator from '../components/StepIndicator';
import TemplateBasics from '../components/steps/TemplateBasics';
import TechStack from '@/components/steps/TechStack';
import TamboIntegration from '@/components/steps/TamboIntegration';
import Preview from '@/components/steps/Preview';
import GenerateDownload from '@/components/steps/GenerateDownload';

export interface TemplateConfig {
  name: string;
  description: string;
  author: string;
  framework: 'nextjs' | 'remix' | 'vite' | 'expo' | 'astro' | '';
  styling: 'tailwind' | 'css-modules' | 'styled-components' | '';
  auth?: 'clerk' | 'supabase' | 'nextauth' | 'none';
  database?: 'prisma' | 'drizzle' | 'supabase' | 'none';
  integrationFocus: 'components' | 'tools' | 'both' | '';
  exampleComponent: string;
  componentDescription: string;
  typescript: boolean;
  eslint: boolean;
  prettier: boolean;
}

const STEPS = [
  { id: 1, name: 'Template Basics', icon: '📝' },
  { id: 2, name: 'Tech Stack', icon: '⚙️' },
  { id: 3, name: 'Tambo Setup', icon: '🤖' },
  { id: 4, name: 'Review', icon: '👀' },
  { id: 5, name: 'Generate', icon: '📦' },
];

export default function TemplateGenerator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<TemplateConfig>({
    name: '',
    description: '',
    author: '',
    framework: '',
    styling: '',
    auth: 'none',
    database: 'none',
    integrationFocus: '',
    exampleComponent: '',
    componentDescription: '',
    typescript: true,
    eslint: true,
    prettier: true,
  });

  const updateConfig = (updates: Partial<TemplateConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return config.name && config.description && config.author;
      case 2:
        return config.framework && config.styling;
      case 3:
        return config.integrationFocus && config.exampleComponent;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                Tambo Template Generator
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Create production-ready templates for Tambo community
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900">
                Step {currentStep} of {STEPS.length}
              </div>
              <div className="text-xs text-slate-500">
                {STEPS[currentStep - 1].name}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      <main className="max-w-6xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden min-h-[500px]">
          <div className="p-8">
            {currentStep === 1 && (
              <TemplateBasics config={config} updateConfig={updateConfig} />
            )}
            {currentStep === 2 && (
              <TechStack config={config} updateConfig={updateConfig} />
            )}
            {currentStep === 3 && (
              <TamboIntegration config={config} updateConfig={updateConfig} />
            )}
            {currentStep === 4 && <Preview config={config} />}
            {currentStep === 5 && <GenerateDownload config={config} />}
          </div>

          <div className="bg-slate-50 px-8 py-4 flex items-center justify-between border-t">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-2 text-slate-700 font-medium rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Back
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Continue →
              </button>
            ) : (
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <span className="text-green-600">✓</span> Ready to generate
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            Tambo Community Requirements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className={config.typescript ? 'text-green-600' : 'text-slate-400'}>
                {config.typescript ? '✓' : '○'}
              </span>
              <span className={config.typescript ? 'text-slate-900' : 'text-slate-500'}>
                TypeScript with strict mode enabled
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className={config.eslint ? 'text-green-600' : 'text-slate-400'}>
                {config.eslint ? '✓' : '○'}
              </span>
              <span className={config.eslint ? 'text-slate-900' : 'text-slate-500'}>
                ESLint configuration with rules
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className={config.name && config.description ? 'text-green-600' : 'text-slate-400'}>
                {config.name && config.description ? '✓' : '○'}
              </span>
              <span className={config.name && config.description ? 'text-slate-900' : 'text-slate-500'}>
                Complete README with setup instructions
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className={config.integrationFocus ? 'text-green-600' : 'text-slate-400'}>
                {config.integrationFocus ? '✓' : '○'}
              </span>
              <span className={config.integrationFocus ? 'text-slate-900' : 'text-slate-500'}>
                Working Tambo integration example
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-slate-900">
                Runs with npm install && npm run dev
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-slate-900">
                Passes npm run lint && npm run build
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}