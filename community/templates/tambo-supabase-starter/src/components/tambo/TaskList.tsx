import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface TaskListProps {
  filter?: 'all' | 'completed' | 'pending';
  title?: string;
}

export function TaskList({ filter = 'all', title = 'My Tasks' }: TaskListProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to toggle status in SUPABASE
  const toggleTask = async (id: number, currentStatus: boolean) => {
    // 1. Update UI immediately
    setTasks(currentTasks => 
      currentTasks.map(t => t.id === id ? { ...t, is_complete: !currentStatus } : t)
    );

    // 2. Update Real Database
    await supabase.from('todos').update({ is_complete: !currentStatus }).eq('id', id);
  };

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      console.log("Fetching Supabase tasks...");
      
      // 1. Fetch from Supabase
      let query = supabase.from('todos').select('*').order('id');
      
      // 2. Apply Filters
      if (filter === 'completed') query = query.eq('is_complete', true);
      if (filter === 'pending') query = query.eq('is_complete', false);

      const { data, error } = await query;
      
      if (error) {
        console.error("Supabase Error:", error);
      } else {
        console.log("Data received:", data);
        setTasks(data || []);
      }
      setLoading(false);
    };
    fetchTasks();
  }, [filter]);

  return (
    <div style={{ padding: '20px', border: '1px solid #444', borderRadius: '12px', background: '#111', color: 'white', marginTop: '10px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>{title}</h3>
        <span style={{ fontSize: '10px', background: '#222', padding: '4px 8px', borderRadius: '4px', color: '#888' }}>
          LIVE DATA
        </span>
      </div>

      {loading && <p style={{color: '#666', fontSize: '14px'}}>Loading...</p>}
      
      {!loading && tasks.length === 0 && (
        <p style={{color: '#666', fontSize: '14px'}}>
          No tasks found in Supabase. <br/>
          (Check your database table 'todos')
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {tasks.map(t => (
          <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #222' }}>
            <input 
              type="checkbox" 
              checked={t.is_complete} 
              onChange={() => toggleTask(t.id, t.is_complete)}
              style={{ width: '18px', height: '18px', accentColor: 'white', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '15px', textDecoration: t.is_complete ? 'line-through' : 'none', color: t.is_complete ? '#666' : 'white' }}>
              {t.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}