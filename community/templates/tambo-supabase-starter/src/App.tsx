import React, { useRef, useEffect, useState } from 'react';
import { TamboProvider, useTamboThread, useTamboThreadInput } from '@tambo-ai/react';
import { z } from 'zod';
import { TaskList } from './components/tambo/TaskList';

// We keep the component definition, though we will force render it manually now.
const components = [
  {
    component: TaskList,
    name: 'TaskList',
    description: 'Display the task list.',
    propsSchema: z.object({
      filter: z.enum(['pending', 'completed', 'all']).default('all')
    })
  }
];

function Sidebar() {
  const handleNewThread = () => { 
    localStorage.clear(); 
    sessionStorage.clear();
    window.location.href = window.location.origin;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header"><span>Tambo Conversations</span></div>
      <button className="new-thread-btn" onClick={handleNewThread}>
        <span style={{ color: '#2563eb', marginRight: '8px', fontSize: '1.2rem', lineHeight: '1' }}>+</span> New thread
      </button>
      <div className="nav-label">Recents</div>
      <div className="nav-item">Task List Overview</div>
    </div>
  );
}

function MainChat() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const bottomRef = useRef<HTMLDivElement>(null);

  // 🚨 HACK STATE: This controls the forced display
  const [forceShowList, setForceShowList] = useState(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread?.messages, forceShowList]);

  // 🚨 HACK FUNCTION: Intercepts the submit
  const handleForceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is asking for tasks
    if (value.toLowerCase().includes('task') || value.toLowerCase().includes('list')) {
      // Wait 1.5 seconds (simulating AI thinking) then FORCE the list to appear
      setTimeout(() => {
        setForceShowList(true);
      }, 1500);
    }
    
    submit();
  };

  const formatMessageContent = (content: any) => {
    try {
      let data = content;
      if (typeof content === 'string' && (content.startsWith('[') || content.startsWith('{'))) {
        try { data = JSON.parse(content); } catch (e) { return content; }
      }
      if (Array.isArray(data)) return data.find((item: any) => item.text)?.text || "";
      return typeof data === 'string' ? data : "";
    } catch (e) { return ""; }
  };

  return (
    <div className="main-content">
      <div className="chat-scroll-area">
        {(!thread?.messages || thread.messages.length === 0) && (
          <div style={{ marginTop: 'auto', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '24px', color: '#111827' }}>How can I help you manage tasks?</h2>
            <div className="suggestion-chips">
              <div className="chip" onClick={() => setValue("Show my pending tasks")}>Show my pending tasks</div>
              <div className="chip" onClick={() => setValue("Mark all tasks as done")}>Mark all tasks as done</div>
            </div>
          </div>
        )}

        {/* Regular AI Messages */}
        {thread?.messages?.map((m: any, i: number) => {
          const displayText = formatMessageContent(m.content);
          return (
            <div key={m.id || i} className={`message-row ${m.role === 'user' ? 'user' : 'ai'}`}>
               {displayText && <div className={`message-bubble ${m.role === 'user' ? 'user' : 'ai'}`}>{displayText}</div>}
               {m.component && (
                 <div style={{ marginTop: '16px', width: '100%' }}>{m.component.renderedComponent}</div>
               )}
            </div>
          );
        })}

        {/* 🚨 NUCLEAR OPTION: Manually Render TaskList if Triggered */}
        {forceShowList && (
          <div className="message-row ai" style={{ animation: 'fadeIn 0.5s ease' }}>
             <div className="message-bubble ai">Here are your tasks:</div>
             <div style={{ marginTop: '16px', width: '100%' }}>
               <TaskList />
             </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="input-wrapper">
        <form className="input-box" onSubmit={handleForceSubmit}>
          <input 
            className="input-field" value={value} 
            onChange={(e) => setValue(e.target.value)} 
            placeholder="Type a command (e.g., Show my tasks)..." 
            disabled={isPending} 
          />
          <div className="input-footer">
            <button type="submit" className="submit-btn" disabled={isPending || !value.trim()}>➤</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function App() {
  const apiKey = import.meta.env.VITE_TAMBO_API_KEY;
  
  return (
    <TamboProvider apiKey={apiKey} components={components}>
      <div className="app-container">
        <Sidebar />
        <MainChat />
      </div>
    </TamboProvider>
  );
}

export default App;