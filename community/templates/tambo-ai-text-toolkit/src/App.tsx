import { TamboProvider, useTambo } from '@tambo-ai/react';
import { useState } from 'react';
import ActionButtons from './components/tambo/ActionButtons';
import StructuredOutputCards from './components/tambo/StructuredOutputCards';
import TextInputPanel from './components/tambo/TextInputPanel';

const API_KEY = import.meta.env.VITE_TAMBO_API_KEY || '';

function AppContent() {
  const { thread, sendThreadMessage } = useTambo();
  const [inputText, setInputText] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: string) => {
    if (!inputText.trim() || isProcessing) {
      return;
    }

    setSelectedAction(action);
    setIsProcessing(true);

    try {
      const systemPrompt = `You are a UI-first content transformer for a React application using Tambo.

Your task:
- Transform the given input text based on the selected mode.
- Return ONLY valid JSON, matching this EXACT schema:
{
  "title": "string",
  "mode": "simplify | summarize | explain",
  "sections": [
    {
      "heading": "string",
      "points": ["string"]
    }
  ],
  "examples": ["string"]
}

- No markdown.
- No extra keys.
- No missing fields.
- Deterministic structure every time.`;

      const userPrompt = `${systemPrompt}\n\nMode: ${action}\nInput text:\n"${inputText}"\n\nReturn ONLY the JSON object.`;
      
      await sendThreadMessage(userPrompt);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Tambo AI Text Toolkit
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your text with AI-powered tools. Paste or type your text below and choose an action.
          </p>
        </header>

        <div className="space-y-6">
          <TextInputPanel value={inputText} onChange={setInputText} />

          <ActionButtons
            onAction={handleAction}
            selectedAction={selectedAction}
            disabled={!inputText.trim() || isProcessing}
          />

          {thread.messages.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                AI Output (Powered by Tambo)
              </h2>
              <div className="space-y-6">
                {thread.messages
                  .filter((msg: any) => msg.role === 'assistant')
                  .slice(-1) // Only show the last message
                  .map((msg: any, idx: number) => {
                    // Extract text content from Tambo's message structure
                    let textContent = '';
                    
                    if (typeof msg.content === 'string') {
                      textContent = msg.content;
                    } else if (Array.isArray(msg.content)) {
                      textContent = msg.content
                        .map((part: any) => part.text || '')
                        .join('');
                    } else if (msg.content && typeof msg.content === 'object') {
                      textContent = msg.content.text || JSON.stringify(msg.content);
                    }
                    
                    // Parse JSON safely
                    let data = null;
                    try {
                      const jsonStart = textContent.indexOf('{');
                      const jsonEnd = textContent.lastIndexOf('}');
                      if (jsonStart !== -1 && jsonEnd !== -1) {
                         const jsonStr = textContent.substring(jsonStart, jsonEnd + 1);
                         data = JSON.parse(jsonStr);
                      }
                    } catch (e) {
                      // Silently fail during streaming
                    }
                    
                    return (
                      <StructuredOutputCards key={idx} data={data} isLoading={isProcessing} />
                    );
                  })}
              </div>
            </div>
          )}

          {thread.messages.length === 0 && (
            <div className="bg-blue-50 rounded-2xl p-8 text-center border border-blue-100">
              <div className="max-w-md mx-auto">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to transform your text
                </h3>
                <p className="text-gray-600">
                  Enter some text above and click one of the action buttons to see AI-powered transformations in action.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  if (!API_KEY) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Required</h1>
          <p className="text-gray-700 mb-4">
            Please set your Tambo API key in the <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Copy <code className="bg-gray-100 px-1 rounded">.env.example</code> to <code className="bg-gray-100 px-1 rounded">.env</code></li>
            <li>Add your Tambo API key to <code className="bg-gray-100 px-1 rounded">VITE_TAMBO_API_KEY</code></li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <TamboProvider apiKey={API_KEY}>
      <AppContent />
    </TamboProvider>
  );
}

export default App;
