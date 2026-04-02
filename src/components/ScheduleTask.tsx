import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, Save, Trash2, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { subscribeToTasks, createTask, updateTaskStatus, deleteTask, Task } from '../db';
import { toast } from 'sonner';

interface ScheduleTaskProps {
  user: FirebaseUser;
  onBack: () => void;
}

export default function ScheduleTask({ user, onBack }: ScheduleTaskProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', date: '', time: '', description: '' });

  useEffect(() => {
    const unsubscribe = subscribeToTasks(user.uid, (data) => {
      setTasks(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.date || !newTask.time) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    if (pendingTasks.length >= 5) {
      toast.error("You can only have up to 5 pending tasks at a time.");
      return;
    }
    
    try {
      await createTask(user.uid, newTask);
      setNewTask({ title: '', date: '', time: '', description: '' });
      setIsAdding(false);
      toast.success("Task scheduled successfully.");
    } catch (error) {
      toast.error("Failed to schedule task.");
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      await updateTaskStatus(id, newStatus as 'pending' | 'completed');
    } catch (error) {
      toast.error("Failed to update task status.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      toast.success("Task deleted.");
    } catch (error) {
      toast.error("Failed to delete task.");
    }
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden relative"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] animate-blob" style={{ backgroundColor: 'var(--blob-color)' }} />
        <div className="absolute bottom-[-20%] right-[20%] w-[40%] h-[40%] rounded-full blur-[100px] animate-blob animation-delay-4000" style={{ backgroundColor: 'var(--blob-color)' }} />
      </div>

      <header
        className="h-16 flex items-center justify-between px-6 backdrop-blur-xl z-10"
        style={{ borderBottom: '1px solid var(--border-secondary)', backgroundColor: 'var(--glass-bg)' }}
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg transition-colors flex items-center gap-2"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <ChevronLeft size={20} />
            <span className="font-semibold text-sm uppercase tracking-wider">Back to Chat</span>
          </button>
          <div className="h-6 w-px" style={{ backgroundColor: 'var(--border-secondary)' }} />
          <div className="flex items-center gap-2" style={{ color: 'var(--accent)' }}>
            <Calendar size={20} />
            <h1 className="text-lg font-bold uppercase tracking-widest">Schedule Tasks</h1>
          </div>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all shadow-lg font-semibold text-sm"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          <Plus size={18} />
          Add Task
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 z-10 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          {isAdding && (
            <div
              className="rounded-2xl p-6 shadow-xl backdrop-blur-md"
              style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--border-primary)' }}
            >
              <h2 className="text-xl font-bold mb-6 uppercase tracking-tight" style={{ color: 'var(--accent)' }}>Create New Task</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Task Title</label>
                  <input 
                    type="text" 
                    value={newTask.title}
                    onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What needs to be done?"
                    className="w-full rounded-xl px-4 py-3 focus:outline-none transition-colors"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Date</label>
                    <input 
                      type="date" 
                      value={newTask.date}
                      onChange={e => setNewTask(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 focus:outline-none transition-colors"
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Time</label>
                    <input 
                      type="time" 
                      value={newTask.time}
                      onChange={e => setNewTask(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 focus:outline-none transition-colors"
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Description</label>
                  <textarea 
                    value={newTask.description}
                    onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add some details..."
                    rows={3}
                    className="w-full rounded-xl px-4 py-3 focus:outline-none transition-colors resize-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-2.5 rounded-xl transition-all font-semibold text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddTask}
                  className="px-8 py-2.5 rounded-xl transition-all shadow-lg font-bold text-sm flex items-center gap-2"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  <Save size={18} />
                  Save Task
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {tasks.length === 0 && !isAdding ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}
                >
                  <Clock size={40} style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tighter mb-2">No Tasks Scheduled</h3>
                <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>Stay organized by scheduling your upcoming tasks and deadlines.</p>
              </div>
            ) : (
              tasks.map(task => (
                <div 
                  key={task.id} 
                  className={`group rounded-2xl p-5 flex items-center gap-6 transition-all ${task.status === 'completed' ? 'opacity-60' : ''}`}
                  style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--border-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
                >
                  <button 
                    onClick={() => toggleStatus(task.id, task.status)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: task.status === 'completed' ? '#10b981' : 'var(--bg-tertiary)',
                      color: task.status === 'completed' ? '#ffffff' : 'var(--text-tertiary)',
                      border: task.status === 'completed' ? 'none' : '1px solid var(--border-secondary)',
                    }}
                  >
                    {task.status === 'completed' ? <CheckCircle2 size={24} /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3
                        className={`font-bold text-lg truncate tracking-tight ${task.status === 'completed' ? 'line-through' : ''}`}
                        style={{ color: task.status === 'completed' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
                      >
                        {task.title}
                      </h3>
                      {task.status === 'pending' && (
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest"
                          style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid var(--accent-muted)' }}
                        >
                          Upcoming
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {task.date}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {task.time}
                      </div>
                    </div>
                    {task.description && (
                      <p className="mt-2 text-sm line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{task.description}</p>
                    )}
                  </div>

                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--danger-muted)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
    </div>
  );
}
