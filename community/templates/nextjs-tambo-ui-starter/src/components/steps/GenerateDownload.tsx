'use client';

import { useState } from 'react';
import { TemplateConfig } from '@/app/page';
import JSZip from 'jszip';
import { generateTemplateFiles } from '@/lib/generators';

interface GenerateDownloadProps {
  config: TemplateConfig;
}

export default function GenerateDownload({ config }: GenerateDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      setGenerationProgress(10);

      const files = generateTemplateFiles(config);
      setGenerationProgress(40);

      const zip = new JSZip();
      const folder = zip.folder(config.name);

      if (!folder) throw new Error('Failed to create ZIP folder');

      Object.entries(files).forEach(([path, content]) => {
        folder.file(path, content);
      });

      setGenerationProgress(70);

      const blob = await zip.generateAsync({ type: 'blob' });
      setGenerationProgress(90);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.name}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      setGenerationProgress(100);
      setIsGenerated(true);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate template. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Generate Template</h2>
        <p className="text-slate-600">
          Ready to generate your template! This will create a complete, production-ready project.
        </p>
      </div>

      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
        {!isGenerating && !isGenerated && (
          <div className="space-y-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">📦</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Ready to Generate</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Click the button below to generate your {config.name} template. This will create a ZIP
              file with all necessary files.
            </p>
            <button
              onClick={handleGenerate}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              Generate Template
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="space-y-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <span className="text-4xl">⚙️</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Generating...</h3>
            <div className="max-w-md mx-auto">
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="text-sm text-slate-600 mt-2">{generationProgress}% complete</p>
            </div>
          </div>
        )}

        {isGenerated && (
          <div className="space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">✓</span>
            </div>
            <h3 className="text-xl font-semibold text-green-900">Template Generated!</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Your template has been downloaded. Extract the ZIP and follow the instructions in the
              README.
            </p>
            <button
              onClick={handleGenerate}
              className="px-6 py-2 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              Download Again
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            Configuration Files
          </h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> package.json
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> tsconfig.json
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> .eslintrc.js
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> .prettierrc
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> .env.example
            </li>
          </ul>
        </div>

        <div className="border border-slate-200 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">Source Code</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> App structure
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Tambo components
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Styling setup
            </li>
            {config.auth !== 'none' && (
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Auth integration
              </li>
            )}
            {config.database !== 'none' && (
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Database schema
              </li>
            )}
          </ul>
        </div>

        <div className="border border-slate-200 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            Documentation
          </h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Complete README
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Setup instructions
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Prerequisites list
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Usage examples
            </li>
          </ul>
        </div>

        <div className="border border-slate-200 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            Tambo Integration
          </h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Component example
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Zod schemas
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Proper registration
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> Type definitions
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
          Submitting Your Template
        </h3>
        <ol className="space-y-3 text-sm text-purple-800">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <div>
              <strong>Test thoroughly:</strong> Run{' '}
              <code className="bg-purple-100 px-1 rounded">npm install && npm run dev</code>, ensure
              no errors
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <div>
              <strong>Record video demo:</strong> Show the template running and Tambo integration
              working
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <div>
              <strong>Add to repo:</strong> Place in{' '}
              <code className="bg-purple-100 px-1 rounded">community/templates/{config.name}/</code>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <div>
              <strong>Create PR:</strong> Include video link and description in PR description
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">5.</span>
            <div>
              <strong>Pass checks:</strong> Ensure{' '}
              <code className="bg-purple-100 px-1 rounded">npm run lint</code> and
              <code className="bg-purple-100 px-1 rounded ml-1">npm run build</code> pass
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
