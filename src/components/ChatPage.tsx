import React, { useRef, useEffect } from 'react';
import { Send, Paperclip, Globe, Bot, User, FileText, Copy, Brush, Compass, Monitor, BookOpen, X, ChevronDown, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppMessage, Attachment, FOUR_EVERLAND_MODELS } from '../api';
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
  selectedModel: string;
  setSelectedModel: (val: string) => void;
  isModelMenuOpen: boolean;
  setIsModelMenuOpen: (val: boolean) => void;
  setIsCanvasOpen: (val: boolean) => void;
  currentConversationId: string | null;
  handleDeleteConversation: (e: React.MouseEvent, id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

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
  selectedModel,
  setSelectedModel,
  isModelMenuOpen,
  setIsModelMenuOpen,
  setIsCanvasOpen,
  currentConversationId,
  handleDeleteConversation,
  fileInputRef,
  textareaRef,
  messagesEndRef
}: ChatPageProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full relative">
      {/* Clear Chat History Button */}
      {currentConversationId && (
        <div className="absolute top-0 right-4 z-20">
          <button 
            onClick={(e) => handleDeleteConversation(e, currentConversationId)}
            className="p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 hover:text-lime-400 transition-colors flex items-center gap-2 text-sm font-medium"
            title="Clear Chat History"
          >
            <Brush size={18} />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth custom-scrollbar">
        <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-32">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
              <div className="w-16 h-16 bg-zinc-800/50 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 shadow-sm border border-white/5">
                <Bot size={32} className="text-lime-400" />
              </div>
              <h1 className="text-2xl font-semibold mb-2 text-lime-400">How can I help you today?</h1>
              <p className="text-zinc-400 max-w-md text-sm">Experience the power of multiple AI models. Upload files, search the web, and get intelligent responses.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-emerald-600'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`flex flex-col gap-2 flex-1 min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1">
                      {msg.attachments.map(att => (
                        <div key={att.id} className="flex items-center gap-2 bg-zinc-800 p-2 rounded-xl border border-zinc-700 max-w-xs">
                          {att.type === 'image' ? (
                            <img src={att.data} alt={att.name} referrerPolicy="no-referrer" className="w-12 h-12 object-cover rounded-lg" />
                          ) : (
                            <div className="w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center">
                              <FileText size={20} className="text-zinc-400" />
                            </div>
                          )}
                          <div className="text-sm truncate pr-2 font-medium">{att.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Message Content */}
                  {msg.content && (
                    <div className={`px-5 py-3.5 rounded-3xl max-w-full sm:max-w-3xl break-words overflow-hidden ${msg.role === 'user' ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-100'}`}>
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      ) : (
                        <div className="relative group">
                          <button
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="absolute -top-10 right-0 p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy to clipboard"
                          >
                            <Copy size={16} />
                          </button>
                          <div className="prose prose-invert prose-zinc max-w-none prose-p:leading-[2.2] prose-pre:bg-[#0d0d0d] prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:max-w-full">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({node, ...props}) => <h1 className="text-lime-400 uppercase font-bold" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lime-400 uppercase font-bold" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-lime-400 uppercase font-bold" {...props} />,
                                code({node, className, children, ...props}) {
                                  const isInline = !className;
                                  if (isInline) return <code className={className} {...props}>{children}</code>;
                                  return (
                                    <div className="my-4 p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between group transition-all hover:border-lime-400/30">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-lime-400 border border-white/5 shadow-inner">
                                          <Code size={20} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-100">Generated Artifact</span>
                                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Ready to build in IDE</span>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => navigate('/build')}
                                        className="px-4 py-2 bg-lime-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95"
                                      >
                                        Open IDE
                                      </button>
                                    </div>
                                  );
                                }
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {msg.isStreaming && !msg.content && (
                    <div className="flex items-center gap-1.5 h-6 px-4 py-2 bg-zinc-800/50 rounded-full w-fit mt-2">
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-10 pb-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto relative">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="absolute bottom-full left-0 mb-3 flex flex-wrap gap-2 p-2 bg-zinc-800/90 backdrop-blur-md rounded-2xl border border-zinc-700 w-full shadow-lg">
              {attachments.map(att => (
                <div key={att.id} className="relative group flex items-center gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-700 max-w-[200px]">
                  {att.type === 'image' ? (
                    <img src={att.data} alt={att.name} referrerPolicy="no-referrer" className="w-10 h-10 object-cover rounded-lg" />
                  ) : (
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                      <FileText size={18} className="text-zinc-400" />
                    </div>
                  )}
                  <div className="text-xs truncate flex-1 font-medium">{att.name}</div>
                  <button 
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-700 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex flex-col bg-[#2f2f2f] border border-zinc-700 rounded-3xl shadow-lg focus-within:border-zinc-500 transition-all">
            <div className="flex items-center px-4 pt-3 pb-1">
              <div className="relative">
                <button 
                  onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-[10px] font-bold text-zinc-400 hover:text-emerald-400 transition-all"
                >
                  {selectedModel.split('/').pop()}
                  <ChevronDown size={12} />
                </button>
                
                {isModelMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-zinc-800 bg-black/20">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">4EVERLAND Models</span>
                    </div>
                    {FOUR_EVERLAND_MODELS.map(model => (
                      <button
                        key={model}
                        onClick={() => {
                          setSelectedModel(model);
                          setIsModelMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[10px] font-bold transition-colors ${selectedModel === model ? 'bg-emerald-400 text-black' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
              placeholder="Message AI..."
              className="w-full max-h-48 min-h-[56px] bg-transparent text-zinc-100 placeholder-zinc-400 resize-none pt-1 pb-4 pl-5 pr-12 focus:outline-none rounded-3xl"
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
                  className="p-2 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
                  title="Attach file"
                >
                  <Paperclip size={20} />
                </button>
                <button 
                  onClick={() => {
                    setWebSearch(!webSearch);
                    if (!webSearch) setLiveBrowser(false);
                  }}
                  className={`p-2 rounded-full transition-colors flex items-center gap-2 ${webSearch ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'}`}
                  title="Web Search"
                >
                  <Globe size={20} />
                  {webSearch && <span className="text-xs font-medium pr-1">Search On</span>}
                </button>
                
                <button 
                  onClick={() => {
                    setLiveBrowser(!liveBrowser);
                    if (!liveBrowser) setWebSearch(false);
                  }}
                  className={`p-2 rounded-full transition-colors flex items-center gap-2 ${liveBrowser ? 'text-blue-400 bg-blue-400/10' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'}`}
                  title="Live Browser Agent"
                >
                  <Compass size={20} />
                  {liveBrowser && <span className="text-xs font-medium pr-1">Browser Agent</span>}
                </button>
                <button 
                  onClick={() => setIsCanvasOpen(true)}
                  className="p-2 rounded-full text-zinc-400 hover:text-lime-400 hover:bg-lime-400/10 transition-colors flex items-center gap-2"
                  title="Live Code Canvas"
                >
                  <Monitor size={20} />
                </button>
                <button 
                  className="p-2 rounded-full text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors flex items-center gap-2"
                  title="Instructions"
                >
                  <BookOpen size={20} />
                </button>
              </div>
              
              <button
                onClick={isLoading ? stopGeneration : handleSend}
                disabled={(!input.trim() && attachments.length === 0 && !isLoading)}
                className="p-2 rounded-full bg-lime-400 text-black hover:bg-lime-500 disabled:opacity-50 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:hover:bg-zinc-700 transition-colors flex items-center justify-center w-10 h-10"
              >
                {isLoading ? <X size={18} /> : <Send size={18} className="ml-0.5" />}
              </button>
            </div>
          </div>
          <div className="text-center mt-3">
            <span className="text-xs text-zinc-500">AI can make mistakes. Consider verifying important information.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
