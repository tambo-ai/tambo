import React from 'react';
import { TamboProvider, useTamboThread, useTamboThreadInput } from '@tambo-ai/react';
import { z } from 'zod';
import { TaskList } from './components/tambo/TaskList';

const components = [
  {
    component: TaskList,
    name: 'TaskList',
    description: 'Use this tool WHENEVER the user mentions tasks, todos, or lists.',
    propsSchema: z.object({
      filter: z.string().optional(),
      title: z.string().optional()
    })
  }
];

function ChatInterface() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  const formatMessageContent = (content: any) => {
    try {
      let data = content;
      if (typeof content === 'string' && (content.startsWith('[') || content.startsWith('{'))) {
        try { data = JSON.parse(content); } catch (e) { return content; }
      }
      if (Array.isArray(data)) {
        const textPart = data.find((item: any) => item.text);
        return textPart ? textPart.text : "";
      }
      if (typeof data === 'object' && data !== null) return data.text || "";
      return String(data);
    } catch (e) { return ""; }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ minHeight: '300px', border: '1px solid #333', padding: '20px', marginBottom: '20px', borderRadius: '12px', background: '#1a1a1a', color: 'white' }}>
        
        {(!thread?.messages || thread.messages.length === 0) && (
          <p style={{ color: '#888', textAlign: 'center', marginTop: '40px' }}>
            Try asking: "Open my task list"
          </p>
        )}
        
        {thread?.messages?.map((m: any, i: number) => {
          const displayText = formatMessageContent(m.content);

          return (
            <div key={i} style={{ marginBottom: '15px', textAlign: m.role === 'user' ? 'right' : 'left' }}>
               {displayText && (
                 <div style={{ 
                   background: m.role === 'user' ? '#333' : '#444', 
                   color: 'white',
                   padding: '10px 16px', 
                   borderRadius: '20px',
                   display: 'inline-block',
                   maxWidth: '80%',
                   textAlign: 'left'
                 }}>
                   {displayText}
                 </div>
               )}

               {m.component && (
                 <div style={{ marginTop: '15px' }}>
                   {m.component.renderedComponent || <TaskList title="My Tasks (AI Generated)" />}
                 </div>
               )}
            </div>
          );
        })}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ display: 'flex', gap: '10px' }}>
        <input 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask AI to manage your tasks..."
          disabled={isPending}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: 'white', fontSize: '16px' }}
        />
        <button 
          type="submit" 
          disabled={isPending}
          style={{ padding: '12px 24px', background: 'white', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {isPending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

function App() {
  const apiKey = import.meta.env.VITE_TAMBO_API_KEY;
  return (
    <TamboProvider 
      apiKey={apiKey}
      components={components}
    >
      <div style={{ 
        width: '100%',
        minHeight: '100vh', 
        background: '#000', 
        display: 'flex', 
        justifyContent: 'center', 
        paddingTop: '40px' 
      }}>
        
        <div style={{ 
          width: '100%', 
          maxWidth: '700px', 
          fontFamily: 'sans-serif', 
          color: 'white',
          padding: '20px'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '2rem' }}>
            My AI Task Manager
          </h1>
          <ChatInterface />
        </div>

      </div>
    </TamboProvider>
  );
}

export default App;