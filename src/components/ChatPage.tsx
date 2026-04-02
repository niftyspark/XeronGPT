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
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
        style={{
          backgroundColor: msg.role === 'user' ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
          border: '1px solid var(--border-secondary)',
        }}
      >
        {msg.role === 'user'
          ? <User size={18} style={{ color: 'var(--text-secondary)' }} />
          : <Bot size={18} style={{ color: 'var(--accent)' }} />
        }
      </div>
      <div className={`flex flex-col gap-2 flex-1 min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className={`flex flex-wrap gap-2 mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.attachments.map(att => (
              <div
                key={att.id}
                className="flex items-center gap-2 p-2 rounded-xl max-w-xs"
                style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}
              >
                {att.type === 'image' ? (
                  <img src={att.data} alt={att.name} referrerPolicy="no-referrer" className="w-12 h-12 object-cover rounded-lg" />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <FileText size={20} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                )}
                <div className="text-sm truncate pr-2 font-medium" style={{ color: 'var(--text-secondary)' }}>{att.name}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Message Content */}
        {msg.content && (
          <div
            className="px-5 py-4 rounded-2xl w-full break-words overflow-hidden relative group neumorphic-card"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            {msg.role === 'user' ? (
              <div className="whitespace-pre-wrap leading-relaxed font-mono text-sm">{msg.content}</div>
            ) : (
              <>
                <button
                  onClick={handleCopy}
                  className={`absolute top-2 right-2 p-2 rounded-lg transition-all duration-200 z-10 ${
                    copied 
                      ? 'opacity-100' 
                      : 'opacity-0 group-hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: copied ? 'var(--accent-muted)' : 'var(--bg-tertiary)',
                    color: copied ? 'var(--accent)' : 'var(--text-tertiary)',
                  }}
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <div className="prose prose-invert prose-zinc max-w-none prose-p:leading-[1.8] prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:max-w-full"
                  style={{
                    ['--tw-prose-body' as any]: 'var(--text-primary)',
                    ['--tw-prose-headings' as any]: 'var(--accent)',
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="uppercase font-bold tracking-wider" style={{ color: 'var(--accent)' }} {...props} />,
                      h2: ({node, ...props}) => <h2 className="uppercase font-bold tracking-wider" style={{ color: 'var(--accent)' }} {...props} />,
                      h3: ({node, ...props}) => <h3 className="uppercase font-bold tracking-wider" style={{ color: 'var(--accent)' }} {...props} />,
                      code({node, className, children, ...props}) {
                        const isInline = !className;
                        if (isInline) return <code className={className} {...props}>{children}</code>;
                        
                        const codeContent = String(children).replace(/\n$/, '');
                        
                        return (
                          <div
                            className="my-4 rounded-xl overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}
                          >
                            <div
                              className="flex items-center justify-between px-4 py-2"
                              style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-secondary)' }}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Code</span>
                              <button 
                                onClick={() => navigator.clipboard.writeText(codeContent)}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                                title="Copy code"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                            <pre className="p-4 overflow-x-auto text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
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
          <div
            className="flex items-center gap-1.5 h-6 px-4 py-2 rounded-full w-fit mt-2 neumorphic-inset"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent)', animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent)', animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent)', animationDelay: '300ms' }} />
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
            className="p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-bold uppercase tracking-wider neumorphic-button glassmorphism"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
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
        className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth custom-scrollbar glassmorphism m-6 rounded-3xl"
        style={{ border: '1px solid var(--glass-border)' }}
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
            <div
              className="mb-3 flex flex-wrap gap-2 p-3 glassmorphism rounded-2xl w-full shadow-lg"
              style={{ border: '1px solid var(--glass-border)' }}
            >
              {attachments.map(att => (
                <div
                  key={att.id}
                  className="relative group flex items-center gap-3 p-2 rounded-xl max-w-[200px]"
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}
                >
                  {att.type === 'image' ? (
                    <img src={att.data} alt={att.name} referrerPolicy="no-referrer" className="w-10 h-10 object-cover rounded-lg" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <FileText size={18} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  )}
                  <div className="text-xs truncate flex-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{att.name}</div>
                  <button 
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shadow-sm glassmorphism"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
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
              className="w-full max-h-48 min-h-[50px] bg-transparent resize-none pt-4 pb-4 pl-5 pr-14 focus:outline-none rounded-2xl font-mono text-sm"
              style={{ color: 'var(--text-primary)', ['--tw-placeholder-opacity' as any]: 1 }}
              rows={1}
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
                  className="p-2.5 rounded-xl transition-all duration-300 neumorphic-button glassmorphism"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>
                <button 
                  onClick={() => {
                    setWebSearch(!webSearch);
                    if (!webSearch) setLiveBrowser(false);
                  }}
                  className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 neumorphic-button glassmorphism ${webSearch ? 'neumorphic-inset' : ''}`}
                  style={{ color: webSearch ? 'var(--accent)' : 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => { if (!webSearch) e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { if (!webSearch) e.currentTarget.style.color = 'var(--text-tertiary)'; }}
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
                  className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 neumorphic-button glassmorphism ${liveBrowser ? 'neumorphic-inset' : ''}`}
                  style={{ color: liveBrowser ? 'var(--accent)' : 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => { if (!liveBrowser) e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { if (!liveBrowser) e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                  title="Live Browser Agent"
                >
                  <Compass size={18} />
                  {liveBrowser && <span className="text-xs font-bold uppercase tracking-wider">Browser</span>}
                </button>
              </div>
              
              <button
                onClick={() => isLoading ? stopGeneration() : handleSend()}
                disabled={(!input.trim() && attachments.length === 0 && !isLoading)}
                className="p-3 rounded-xl disabled:opacity-40 transition-all duration-300 flex items-center justify-center w-11 h-11 neumorphic-button glassmorphism"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--accent)',
                }}
              >
                {isLoading ? <X size={20} /> : <Send size={20} className="ml-0.5" />}
              </button>
            </div>
          </div>
          <div className="text-center mt-4">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
              System may produce inaccurate outputs. Verify critical data.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
