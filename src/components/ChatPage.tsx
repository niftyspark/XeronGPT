import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, Globe, Bot, User, FileText, Copy, Check, Brush, Compass, Monitor, BookOpen, X, ChevronDown, Code, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppMessage, Attachment } from '../api';
import { useNavigate } from 'react-router-dom';

interface ChatPageProps {
  messages: AppMessage[];
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  handleSend: () => void;
  stopGeneration: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  attachments: Attachment[];
  removeAttachment: (id: string) => void;
  webSearch: boolean;
  setWebSearch: (val: boolean) => void;
  liveBrowser: boolean;
  setLiveBrowser: (val: boolean) => void;
  setIsCanvasOpen: (val: boolean) => void;
  currentConversationId: string | null;
  handleDeleteConversation: (e: React.MouseEvent, id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}

const MessageBubble = ({ msg }: { msg: AppMessage }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div key={msg.id} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-[#25282c] border border-[#35383e]' : 'bg-[#2d3035] border border-[#35383e]'}`}>
        {msg.role === 'user' ? <User size={18} className="text-zinc-400" /> : <Bot size={18} className="text-[#BEE639]" />}
      </div>
      <div className={`flex flex-col gap-2 flex-1 min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className={`flex flex-wrap gap-2 mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.attachments.map(att => (
              <div key={att.id} className="flex items-center gap-2 bg-[#25282c] p-2 rounded-xl border border-[#35383e] max-w-xs">
                {att.type === 'image' ? (
                  <img src={att.data} alt={att.name} referrerPolicy="no-referrer" className="w-12 h-12 object-cover rounded-lg" />
                ) : (
                  <div className="w-12 h-12 bg-[#2d3035] rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-zinc-500" />
                  </div>
                )}
                <div className="text-sm truncate pr-2 font-medium text-zinc-300">{att.name}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Message Content */}
        {msg.content && (
          <div className={`px-5 py-4 rounded-2xl w-full break-words overflow-hidden relative group neumorphic-card ${msg.role === 'user' ? 'bg-[#2d3035] text-zinc-100' : 'bg-[#2d3035] text-zinc-100'}`}>
            {msg.role === 'user' ? (
              <div className="whitespace-pre-wrap leading-relaxed font-mono text-sm">{msg.content}</div>
            ) : (
              <>
                <button
                  onClick={handleCopy}
                  className={`absolute top-2 right-2 p-2 rounded-lg transition-all duration-200 z-10 ${
                    copied 
                      ? 'bg-[#BEE639]/20 text-[#BEE639] opacity-100' 
                      : 'bg-[#25282c]/80 text-zinc-500 hover:text-zinc-100 opacity-0 group-hover:opacity-100'
                  }`}
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <div className="prose prose-invert prose-zinc max-w-none prose-p:leading-[1.8] prose-pre:bg-[#25282c] prose-pre:border prose-pre:border-[#35383e] prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:max-w-full">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-[#BEE639] uppercase font-bold tracking-wider" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-[#BEE639] uppercase font-bold tracking-wider" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-[#BEE639] uppercase font-bold tracking-wider" {...props} />,
                      code({node, className, children, ...props}) {
                        const isInline = !className;
                        if (isInline) return <code className={className} {...props}>{children}</code>;
                        
                        const codeContent = String(children).replace(/\n$/, '');
                        
                        return (
                          <div className="my-4 bg-[#25282c] border border-[#35383e] rounded-xl overflow-hidden group/code">
                            <div className="flex items-center justify-between px-4 py-2 bg-[#2d3035] border-b border-[#35383e]">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Code</span>
                              <button 
                                onClick={() => navigator.clipboard.writeText(codeContent)}
                                className="p-1.5 rounded-lg bg-[#25282c] text-zinc-400 hover:text-[#BEE639] transition-colors"
                                title="Copy code"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                            <pre className="p-4 overflow-x-auto text-sm text-zinc-200 font-mono">
                              <code>{children}</code>
                            </pre>
                          </div>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </>
            )}
          </div>
        )}
        {msg.isStreaming && !msg.content && (
          <div className="flex items-center gap-1.5 h-6 px-4 py-2 bg-[#2d3035] rounded-full w-fit mt-2 neumorphic-inset">
            <div className="w-2 h-2 bg-[#BEE639] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-[#BEE639] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-[#BEE639] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
      {/* Spacer to balance avatar and ensure content is centered */}
      <div className="w-9 h-9 flex-shrink-0 hidden sm:block" />
    </div>
  );
};

export default function ChatPage({
  messages,
  input,
  setInput,
  isLoading,
  handleSend,
  stopGeneration,
  onFileChange,
  attachments,
  removeAttachment,
  webSearch,
  setWebSearch,
  liveBrowser,
  setLiveBrowser,
  setIsCanvasOpen,
  currentConversationId,
  handleDeleteConversation,
  fileInputRef,
  textareaRef,
  messagesEndRef,
  scrollContainerRef,
  onPaste
}: ChatPageProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full relative">
      {/* Clear Chat History Button */}
      <div className="absolute top-0 right-4 z-20 flex items-center gap-2">
        {currentConversationId && (
          <button 
            onClick={(e) => handleDeleteConversation(e, currentConversationId)}
            className="p-2.5 rounded-xl hover:bg-[#35383e] text-zinc-500 hover:text-red-400 transition-all duration-300 flex items-center gap-2 text-sm font-bold uppercase tracking-wider neumorphic-button glassmorphism"
            title="Clear Chat History"
          >
            <Brush size={16} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth custom-scrollbar glassmorphism m-6 rounded-3xl border border-white/10"
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-32">
          {messages.length === 0 ? (
            <div className="flex-1" />
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4 sm:px-6">
        <div className="max-w-3xl w-full relative">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2 p-3 glassmorphism rounded-2xl border border-white/10 w-full shadow-lg">
              {attachments.map(att => (
                <div key={att.id} className="relative group flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/10 max-w-[200px]">
                  {att.type === 'image' ? (
                    <img src={att.data} alt={att.name} referrerPolicy="no-referrer" className="w-10 h-10 object-cover rounded-lg" />
                  ) : (
                    <div className="w-10 h-10 bg-black/20 rounded-lg flex items-center justify-center">
                      <FileText size={18} className="text-zinc-500" />
                    </div>
                  )}
                  <div className="text-xs truncate flex-1 font-medium text-zinc-300">{att.name}</div>
                  <button 
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-black/40 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100 shadow-sm glassmorphism"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex flex-col glassmorphism rounded-2xl shadow-lg transition-all duration-300">
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
              onPaste={onPaste}
              placeholder="Enter command..."
              className="w-full max-h-48 min-h-[50px] bg-transparent text-zinc-100 placeholder-zinc-400 resize-none pt-4 pb-4 pl-5 pr-14 focus:outline-none rounded-2xl font-mono text-sm"
              rows={1}
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
            />
            
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onFileChange} 
                  className="hidden" 
                  multiple 
                  accept="image/*,.txt,.md,.json,.csv,.js,.ts,.py,.html,.css"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl text-zinc-500 hover:text-[#BEE639] hover:bg-[#35383e] transition-all duration-300 neumorphic-button glassmorphism"
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>
                <button 
                  onClick={() => {
                    setWebSearch(!webSearch);
                    if (!webSearch) setLiveBrowser(false);
                  }}
                  className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 neumorphic-button glassmorphism ${webSearch ? 'text-[#BEE639] neumorphic-inset' : 'text-zinc-500 hover:text-[#BEE639] hover:bg-[#35383e]'}`}
                  title="Web Search"
                >
                  <Globe size={18} />
                  {webSearch && <span className="text-xs font-bold uppercase tracking-wider">Search</span>}
                </button>
                
                <button 
                  onClick={() => {
                    setLiveBrowser(!liveBrowser);
                    if (!liveBrowser) setWebSearch(false);
                  }}
                  className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 neumorphic-button glassmorphism ${liveBrowser ? 'text-[#BEE639] neumorphic-inset' : 'text-zinc-500 hover:text-[#BEE639] hover:bg-[#35383e]'}`}
                  title="Live Browser Agent"
                >
                  <Compass size={18} />
                  {liveBrowser && <span className="text-xs font-bold uppercase tracking-wider">Browser</span>}
                </button>
              </div>
              
              <button
                onClick={() => isLoading ? stopGeneration() : handleSend()}
                disabled={(!input.trim() && attachments.length === 0 && !isLoading)}
                className="p-3 rounded-xl bg-[#2d3035] text-[#BEE639] hover:bg-[#35383e] disabled:opacity-50 disabled:bg-[#25282c] disabled:text-zinc-600 transition-all duration-300 flex items-center justify-center w-11 h-11 neumorphic-button glassmorphism"
              >
                {isLoading ? <X size={20} /> : <Send size={20} className="ml-0.5" />}
              </button>
            </div>
          </div>
          <div className="text-center mt-4">
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">System may produce inaccurate outputs. Verify critical data.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
