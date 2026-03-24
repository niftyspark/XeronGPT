import React, { useState } from 'react';
import { saveScheduledTask } from '../db';
import { auth } from '../firebase';

export function TaskScheduler({ onClose }: { onClose: () => void }) {
  const [taskName, setTaskName] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [time, setTime] = useState('00:00');
  const [timezone, setTimezone] = useState('Asia/Karachi');
  const [maxExecutions, setMaxExecutions] = useState(100);
  const [runContinuously, setRunContinuously] = useState(true);
  const [content, setContent] = useState('');

  const handleSave = async () => {
    if (!auth.currentUser) return;
    await saveScheduledTask({
      userId: auth.currentUser.uid,
      name: taskName,
      frequency,
      time,
      timezone,
      maxExecutions,
      runContinuously,
      content
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 text-zinc-100 p-6 rounded-lg w-full max-w-2xl">
        <input 
          type="text" 
          placeholder="Enter task name" 
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold mb-6 focus:outline-none"
        />
        
        <div className="space-y-4 mb-6">
          <div className="bg-zinc-800 p-4 rounded-lg">
            <h3 className="font-medium mb-4">Schedule</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400">Frequency</label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full bg-zinc-700 p-2 rounded">
                  <option>Daily</option>
                  <option>Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400">Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-zinc-700 p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400">Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full bg-zinc-700 p-2 rounded">
                  <option>Asia/Karachi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400">Max Executions</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={maxExecutions} onChange={(e) => setMaxExecutions(Number(e.target.value))} className="w-full bg-zinc-700 p-2 rounded" />
                  <span className="text-sm text-zinc-400">times</span>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={runContinuously} onChange={(e) => setRunContinuously(e.target.checked)} />
                Run continuously
              </label>
            </div>
          </div>

          <div className="bg-zinc-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Task Content</h3>
            <textarea 
              placeholder="Enter the prompt or instruction for the agent" 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 bg-zinc-700 p-2 rounded"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-700 rounded">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-zinc-600 rounded">Save as New</button>
        </div>
      </div>
    </div>
  );
}
