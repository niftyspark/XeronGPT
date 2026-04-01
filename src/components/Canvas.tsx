import React, { useState, useEffect, useRef } from 'react';
import { Send, Code, Eye, X, Loader2, Bot, User, ChevronLeft, ChevronRight, Play, Copy, Check, Download, Monitor, Terminal, Sparkles, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamChat, AppMessage } from '../api';
import { subscribeToCanvasState, updateCanvasState } from '../db';

interface CanvasProps {
  onClose: () => void;
  user: any;
  currentMemory?: string;
}

export default function Canvas({ onClose, user, currentMemory }: CanvasProps) {
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #111; color: #39ff14; }\n    h1 { border: 2px solid #39ff14; padding: 20px; }\n    /* Hide scrollbars */\n    ::-webkit-scrollbar { display: none !important; }\n    * { scrollbar-width: none !important; -ms-overflow-style: none !important; }\n  </style>\n</head>\n<body>\n  <h1>Ready to build?</h1>\n</body>\n</html>');
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    setIsLoading(true);
    const currentInput = input;
    const newUserMsg: AppMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }]);

    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const systemMsg: AppMessage = {
        id: 'system',
        role: 'system',
        content: `You are a web developer assistant. When asked to create or modify a website, provide the full HTML/CSS/JS code within a single markdown code block. Ensure the code is self-contained and ready to run in an iframe. Use a futuristic, cyber-industrial theme if not specified otherwise. Keep your explanations brief.`
      };

      const stream = streamChat([systemMsg, ...messages, newUserMsg], {
        userId: user.uid,
        currentMemory
      }, abortControllerRef.current.signal);
      let fullContent = '';
      
      for await (const chunk of stream) {
        // Check if we should abort
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        fullContent += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { ...msg, content: fullContent }
            : msg
        ));

        // Try to extract code block
        const codeMatch = fullContent.match(/```(?:html|xml|javascript|css)?\s*([\s\S]*?)```/i);
        if (codeMatch && codeMatch[1]) {
          let extractedCode = codeMatch[1].trim();
          
          // Inject scrollbar hiding style if it's an HTML document
          if (extractedCode.toLowerCase().includes('<html') || extractedCode.toLowerCase().includes('<body')) {
            const scrollbarStyle = `
  <style>
    ::-webkit-scrollbar { display: none !important; }
    * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
  </style>
`;
            if (extractedCode.toLowerCase().includes('</head>')) {
              extractedCode = extractedCode.replace(/<\/head>/i, `${scrollbarStyle}</head>`);
            } else if (extractedCode.toLowerCase().includes('<head>')) {
              extractedCode = extractedCode.replace(/<head>/i, `<head>${scrollbarStyle}`);
            } else if (extractedCode.toLowerCase().includes('<body>')) {
              extractedCode = extractedCode.replace(/<body>/i, `<body>${scrollbarStyle}`);
            }
          }
          
          setCode(extractedCode);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        console.error(error);
        setMessages(prev => [...prev, { 
          id: (Date.now() + 2).toString(), 
          role: 'assistant', 
          content: `**Error:** ${error.message}` 
        }]);
      }
    } finally {
      setIsLoading(false);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col font-sans text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#111] z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            <span className="font-semibold text-sm uppercase tracking-wider">Back to Chat</span>
          </button>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-2 text-lime-400">
            <Monitor size={18} />
            <span className="text-sm font-bold uppercase tracking-widest">Live Canvas</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={copyToClipboard}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-lime-400 transition-colors"
            title="Copy Code"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <button 
            onClick={downloadCode}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-lime-400 transition-colors"
            title="Download HTML"
          >
            <Download size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat Sidebar */}
        <div className={`${isSidebarOpen ? 'w-[400px]' : 'w-0'} transition-all duration-300 border-r border-white/10 flex flex-col bg-[#0d0d0d] relative z-10`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                <div className="w-16 h-16 rounded-2xl bg-lime-400/10 flex items-center justify-center mb-4 border border-lime-400/20">
                  <Sparkles size={32} className="text-lime-400" />
                </div>
                <h3 className="text-lg font-bold text-lime-400 mb-2 uppercase tracking-tighter">Canvas Assistant</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">Give me a command to build a website or component. I'll generate the code and show you a live preview.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-zinc-800 border border-white/10' : 'bg-lime-400 text-black shadow-[0_0_10px_rgba(163,230,53,0.2)]'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`flex flex-col gap-2 max-w-[85%] min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm break-words overflow-hidden ${msg.role === 'user' ? 'bg-zinc-800 text-zinc-100 border border-white/5' : 'bg-transparent text-zinc-300'}`}>
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <div className="prose prose-invert prose-zinc max-w-none prose-p:leading-relaxed prose-sm prose-pre:overflow-x-auto prose-pre:max-w-full">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content.replace(/```[\s\S]*?(?:```|$)/gi, '*[Code generated and applied to canvas]*')}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10 bg-[#111]">
            <div className="relative flex items-center bg-zinc-900 border border-white/10 rounded-2xl focus-within:border-lime-400/50 transition-all group">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Command to create..."
                className="w-full max-h-32 min-h-[44px] bg-transparent text-zinc-100 placeholder-zinc-600 resize-none py-3 pl-4 pr-12 focus:outline-none text-sm"
                rows={1}
              />
              <button
                onClick={() => isLoading ? handleStop() : handleSend()}
                disabled={!input.trim() && !isLoading}
                className={`absolute right-2 p-2 rounded-xl transition-all shadow-[0_0_10px_rgba(163,230,53,0.2)] ${isLoading ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-lime-400 text-black hover:bg-lime-500'}`}
              >
                {isLoading ? <Square size={16} fill="currentColor" /> : <Send size={16} />}
              </button>
            </div>
          </div>

          {/* Sidebar Toggle */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#111] border border-white/10 rounded-full flex items-center justify-center text-zinc-500 hover:text-lime-400 transition-colors z-20"
          >
            {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-[#050505] relative overflow-hidden flex flex-col">
          {/* View Mode Bar */}
          <div className="h-12 bg-[#111] border-b border-white/10 flex items-center px-4 justify-between shrink-0">
            <div className="flex bg-zinc-900 p-1 rounded-lg border border-white/5">
              <button 
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'preview' ? 'bg-lime-400 text-black shadow-[0_0_10px_rgba(163,230,53,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Eye size={12} />
                Preview
              </button>
              <button 
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'code' ? 'bg-lime-400 text-black shadow-[0_0_10px_rgba(163,230,53,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Code size={12} />
                Code
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {viewMode === 'preview' ? (
                <div className="bg-black/40 px-3 py-1 rounded text-[10px] font-mono text-zinc-500 uppercase tracking-widest border border-white/5">
                  Live Preview Environment
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Terminal size={12} className="text-lime-400" />
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">index.html</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden">
            {viewMode === 'preview' ? (
              <div className="w-full h-full flex flex-col">
                <iframe 
                  srcDoc={code}
                  title="Canvas Preview"
                  className="flex-1 w-full bg-white"
                  sandbox="allow-scripts"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                <textarea 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 w-full bg-[#0a0a0a] text-lime-400/90 font-mono text-sm p-6 focus:outline-none resize-none selection:bg-lime-400/20"
                  spellCheck={false}
                />
              </div>
            )}
            
            {/* Grid Overlay for Cyber Feel */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
