import React, { useState, useEffect, useRef } from 'react';
import { Send, Code, Globe, Play, Save, ChevronLeft, ChevronRight, Maximize2, Minimize2, Copy, Check, Loader2, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamChat, AppMessage, FOUR_EVERLAND_MODELS, DEFAULT_MODEL } from '../api';
import { subscribeToCanvasState, updateCanvasState } from '../db';
import { User as FirebaseUser } from 'firebase/auth';
import { ChevronDown } from 'lucide-react';

interface BuildPageProps {
  user: FirebaseUser | null;
  onBack: () => void;
  currentMemory: string;
}

export default function BuildPage({ user, onBack, currentMemory }: BuildPageProps) {
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: #39ff14; }\n    .container { border: 1px solid #39ff14; padding: 40px; border-radius: 20px; box-shadow: 0 0 20px rgba(57, 255, 20, 0.2); text-align: center; }\n    h1 { margin: 0; font-size: 2.5rem; text-transform: uppercase; letter-spacing: 4px; }\n    p { color: #888; margin-top: 10px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <h1>System Ready</h1>\n    <p>AI Coding Assistant Initialized</p>\n  </div>\n</body>\n</html>');
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const [activeTab, setActiveTab] = useState<'chat' | 'files'>('chat');
  const [copied, setCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToCanvasState(user.uid, (state) => {
        if (!isLoaded) {
          if (state) {
            setMessages(state.messages);
            setCode(state.code);
          }
          setIsLoaded(true);
        }
      });
      return () => unsubscribe();
    }
  }, [user, isLoaded]);

  useEffect(() => {
    if (user && isLoaded) {
      const timer = setTimeout(() => {
        updateCanvasState(user.uid, messages, code);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, messages, code, isLoaded]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AppMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let fullContent = '';
      const assistantMessageId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        isStreaming: true
      }]);

      const stream = streamChat(
        [...messages, userMessage],
        { userId: user?.uid, currentMemory, model: selectedModel }
      );

      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
        ));

        // Extract code if present
        const codeMatch = fullContent.match(/```html\n([\s\S]*?)\n```/) || 
                         fullContent.match(/```xml\n([\s\S]*?)\n```/) ||
                         fullContent.match(/```[\s\S]*?\n([\s\S]*?)\n```/);
        if (codeMatch && codeMatch[1]) {
          setCode(codeMatch[1]);
        }
      }

      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
      ));
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050505] text-zinc-100 overflow-hidden h-full">
      {/* Header */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-black/40 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            <span className="font-bold text-xs uppercase tracking-widest">Exit IDE</span>
          </button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <div className="flex items-center gap-2 text-lime-400">
            <Sparkles size={18} />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Build Engine v1.0</span>
          </div>
          <div className="h-4 w-px bg-white/10 mx-1" />
          
          <div className="relative">
            <button 
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-lime-400 transition-all"
            >
              {selectedModel.split('/').pop()}
              <ChevronDown size={12} />
            </button>
            
            {isModelMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-white/5 bg-black/20">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">4EVERLAND Models</span>
                </div>
                {FOUR_EVERLAND_MODELS.map(model => (
                  <button
                    key={model}
                    onClick={() => {
                      setSelectedModel(model);
                      setIsModelMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[10px] font-bold transition-colors ${selectedModel === model ? 'bg-lime-400 text-black' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center bg-zinc-900/50 rounded-xl p-1 border border-white/5">
          <button 
            onClick={() => setViewMode('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'code' ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Code size={14} />
            Editor
          </button>
          <button 
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'split' ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Maximize2 size={14} />
            Split
          </button>
          <button 
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Globe size={14} />
            Browser
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={copyCode}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-lime-400 transition-all"
            title="Copy Code"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <button className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold border border-white/5 transition-all flex items-center gap-2">
            <Save size={14} />
            Deploy
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Chat */}
        <div className="w-[350px] border-r border-white/5 flex flex-col bg-black/20">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500">AI Architect</h2>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-lime-400/40" />
              <div className="w-2 h-2 rounded-full bg-lime-400/20" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-6">
                <Bot size={40} className="mb-4 text-lime-400" />
                <p className="text-xs font-bold uppercase tracking-widest">Describe what you want to build</p>
                <p className="text-[10px] mt-2 leading-relaxed">I'll generate the code and you can see it live in the browser.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-zinc-500' : 'text-lime-400'}`}>
                    {msg.role === 'user' ? 'User' : 'Architect'}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed max-w-[90%] ${msg.role === 'user' ? 'bg-zinc-800 text-zinc-100' : 'bg-lime-400/5 border border-lime-400/10 text-zinc-300'}`}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({node, className, children, ...props}) {
                          const isInline = !className;
                          if (isInline) return <code className={className} {...props}>{children}</code>;
                          // Extract filename if possible
                          const codeStr = String(children);
                          const fileNameMatch = codeStr.match(/\/\/\s*File:\s*(.*)/) || codeStr.match(/\/\*\s*File:\s*(.*)\s*\*\//);
                          const fileName = fileNameMatch ? fileNameMatch[1].trim() : 'index.html';
                          
                          return (
                            <div className="my-2 flex items-center gap-2 px-3 py-2 bg-zinc-900/80 border border-white/5 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-lime-400 transition-colors cursor-pointer group">
                              <Code size={14} className="text-lime-400 group-hover:scale-110 transition-transform" />
                              <span className="truncate">{fileName}</span>
                            </div>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                    
                    {msg.role === 'assistant' && msg.content.includes('```') && (
                      <div className="mt-4 p-3 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-lime-400/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-[10px] font-black border border-white/5 text-lime-400 shadow-inner">
                            V1
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-100">Version 1 - Build</div>
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Artifacts generated</div>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-zinc-600 group-hover:text-lime-400 transition-colors" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/5">
            <div className="relative">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask to build something..."
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 pr-12 text-xs focus:outline-none focus:border-lime-500/50 transition-all resize-none h-20"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute bottom-3 right-3 p-2 bg-lime-400 text-black rounded-lg hover:bg-lime-500 disabled:opacity-30 transition-all"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content: Editor & Preview */}
        <div className="flex-1 flex overflow-hidden">
          {(viewMode === 'code' || viewMode === 'split') && (
            <div className={`flex-1 flex flex-col bg-[#0d0d0d] ${viewMode === 'split' ? 'border-r border-white/5' : ''}`}>
              <div className="h-9 bg-zinc-900/50 border-b border-white/5 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40" />
                  <span className="text-[10px] font-bold text-zinc-500 ml-2 uppercase tracking-widest">index.html</span>
                </div>
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">HTML5 / CSS3</div>
              </div>
              <textarea 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-transparent text-lime-400/90 font-mono text-sm p-6 focus:outline-none resize-none no-scrollbar leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}

          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="flex-1 flex flex-col bg-white">
              <div className="h-9 bg-zinc-100 border-b border-zinc-200 flex items-center px-4 gap-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-zinc-300" />
                  <div className="w-2 h-2 rounded-full bg-zinc-300" />
                </div>
                <div className="flex-1 bg-white border border-zinc-200 rounded-md h-6 flex items-center px-3 gap-2">
                  <Globe size={10} className="text-zinc-400" />
                  <span className="text-[10px] text-zinc-400 font-medium truncate">https://build-engine.local/preview</span>
                </div>
                <button 
                  onClick={() => {
                    if (iframeRef.current) {
                      iframeRef.current.srcdoc = code;
                    }
                  }}
                  className="p-1.5 hover:bg-zinc-200 rounded-md text-zinc-500 transition-colors"
                >
                  <Play size={12} />
                </button>
              </div>
              <iframe 
                ref={iframeRef}
                srcDoc={code}
                title="Preview"
                className="flex-1 w-full border-none bg-white"
                sandbox="allow-scripts"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer Status Bar */}
      <footer className="h-6 bg-lime-400 flex items-center px-4 justify-between text-black">
        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            Live Sync: Active
          </div>
          <div>Project: Untitled_App</div>
        </div>
        <div className="text-[9px] font-black uppercase tracking-widest">
          UTF-8 | LF | HTML
        </div>
      </footer>
    </div>
  );
}
