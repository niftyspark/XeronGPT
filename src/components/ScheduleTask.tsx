import React, { useState } from 'react';
import { Calendar, Clock, ChevronLeft, Save, Trash2, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  status: 'pending' | 'completed';
}

interface ScheduleTaskProps {
  onBack: () => void;
}

export default function ScheduleTask({ onBack }: ScheduleTaskProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', date: '', time: '', description: '' });

  const handleAddTask = () => {
    if (!newTask.title || !newTask.date || !newTask.time) return;
    
    const task: Task = {
      id: Date.now().toString(),
      ...newTask,
      status: 'pending'
    };
    
    setTasks(prev => [task, ...prev]);
    setNewTask({ title: '', date: '', time: '', description: '' });
    setIsAdding(false);
  };

  const toggleStatus = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#111] text-zinc-100 overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-lime-500/10 blur-[100px] animate-blob"></div>
        <div className="absolute bottom-[-20%] right-[20%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 backdrop-blur-xl z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            <span className="font-semibold text-sm uppercase tracking-wider">Back to Chat</span>
          </button>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-2 text-lime-400">
            <Calendar size={20} />
            <h1 className="text-lg font-bold uppercase tracking-widest">Schedule Tasks</h1>
          </div>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lime-400 text-black rounded-xl hover:bg-lime-500 transition-all shadow-lg shadow-lime-500/20 font-semibold text-sm"
        >
          <Plus size={18} />
          Add Task
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 z-10 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          {isAdding && (
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
              <h2 className="text-xl font-bold mb-6 text-lime-400 uppercase tracking-tight">Create New Task</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Task Title</label>
                  <input 
                    type="text" 
                    value={newTask.title}
                    onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What needs to be done?"
                    className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-lime-500/50 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Date</label>
                    <input 
                      type="date" 
                      value={newTask.date}
                      onChange={e => setNewTask(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-lime-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Time</label>
                    <input 
                      type="time" 
                      value={newTask.time}
                      onChange={e => setNewTask(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-lime-500/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description</label>
                  <textarea 
                    value={newTask.description}
                    onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add some details..."
                    rows={3}
                    className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-lime-500/50 transition-colors resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all font-semibold text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddTask}
                  className="px-8 py-2.5 bg-lime-400 text-black rounded-xl hover:bg-lime-500 transition-all shadow-lg shadow-lime-500/20 font-bold text-sm flex items-center gap-2"
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
                <div className="w-20 h-20 rounded-3xl bg-zinc-800 flex items-center justify-center mb-6 border border-white/5">
                  <Clock size={40} className="text-zinc-500" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tighter mb-2">No Tasks Scheduled</h3>
                <p className="text-sm max-w-xs mx-auto">Stay organized by scheduling your upcoming tasks and deadlines.</p>
              </div>
            ) : (
              tasks.map(task => (
                <div 
                  key={task.id} 
                  className={`group bg-zinc-900/40 border border-white/5 rounded-2xl p-5 flex items-center gap-6 transition-all hover:bg-zinc-900/60 hover:border-white/10 ${task.status === 'completed' ? 'opacity-60' : ''}`}
                >
                  <button 
                    onClick={() => toggleStatus(task.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${task.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-lime-400 border border-white/5'}`}
                  >
                    {task.status === 'completed' ? <CheckCircle2 size={24} /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`font-bold text-lg truncate tracking-tight ${task.status === 'completed' ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                        {task.title}
                      </h3>
                      {task.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-md bg-lime-400/10 text-lime-400 text-[10px] font-bold uppercase tracking-widest border border-lime-400/20">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
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
                      <p className="mt-2 text-sm text-zinc-400 line-clamp-1">{task.description}</p>
                    )}
                  </div>

                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-3 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
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
