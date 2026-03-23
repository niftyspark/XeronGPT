import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Globe, Plus, MessageSquare, Menu, X, ChevronDown, User, Bot, FileText, Loader2, LogOut, Search, Trash2, Compass, Brush, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamChat, MODELS, AppMessage, handleFileUpload, Attachment } from './api';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { subscribeToConversations, subscribeToMessages, createConversation, saveMessage, deleteConversation, Conversation, DbMessage } from './db';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState(MODELS[0].id);
  const [webSearch, setWebSearch] = useState(false);
  const [liveBrowser, setLiveBrowser] = useState(false);
  const [composioEnabled, setComposioEnabled] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToConversations(user.uid, (convos) => {
        setConversations(convos);
      });
      return () => unsubscribe();
    } else {
      setConversations([]);
      setCurrentConversationId(null);
    }
  }, [user]);

  useEffect(() => {
    if (currentConversationId) {
      const unsubscribe = subscribeToMessages(currentConversationId, (dbMsgs) => {
        const appMsgs: AppMessage[] = dbMsgs.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content
        }));
        setMessages(appMsgs);
      });
      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error?.code === 'auth/unauthorized-domain') {
        alert("This domain is not authorized for Google Sign-In.\n\nPlease go to your Firebase Console -> Authentication -> Settings -> Authorized Domains, and add this website's domain.");
      } else {
        alert(`Login failed: ${error?.message || 'Unknown error'}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat?")) {
      await deleteConversation(id);
      if (currentConversationId === id) {
        startNewChat();
      }
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || !user) return;

    setIsLoading(true);
    const currentInput = input;
    const currentAttachments = [...attachments];

    // Optimistically update UI
    const newUserMsg: AppMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      attachments: currentAttachments
    };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setAttachments([]);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    let convoId = currentConversationId;
    if (!convoId) {
      const title = currentInput.trim().substring(0, 40) || "New Conversation";
      convoId = await createConversation(user.uid, title);
      setCurrentConversationId(convoId);
    }

    // Save user message to DB
    await saveMessage(convoId, user.uid, 'user', newUserMsg.content);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }]);

    try {
      const stream = streamChat([...messages, newUserMsg], model, webSearch, liveBrowser, composioEnabled);
      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { ...msg, content: fullContent }
            : msg
        ));
      }
      // Save assistant message to DB
      await saveMessage(convoId, user.uid, 'assistant', fullContent);
    } catch (error: any) {
      console.error(error);
      const errorMsg = `**Error:** ${error.message}`;
      setMessages(prev => [...prev, { 
        id: (Date.now() + 2).toString(), 
        role: 'assistant', 
        content: errorMsg 
      }]);
      await saveMessage(convoId, user.uid, 'assistant', errorMsg);
    } finally {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
      setIsLoading(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        try {
          const att = await handleFileUpload(file);
          newAttachments.push({ ...att, id: Date.now().toString() + i });
        } catch (err) {
          console.error('Failed to read file', err);
        }
      }
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  if (!isAuthReady) {
    return <div className="flex h-screen items-center justify-center bg-[#212121] text-white"><Loader2 className="animate-spin" /></div>;
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111] text-zinc-100 font-sans relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-lime-500/10 blur-[100px] animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] rounded-full bg-teal-500/10 blur-[100px] animate-blob animation-delay-4000"></div>
        </div>

        <div className="text-center max-w-md p-8 bg-black/40 backdrop-blur-xl rounded-3xl shadow-xl border border-white/5 z-10">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-zinc-700">
            <Bot size={32} className="text-lime-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-lime-400">Welcome to AI Chat</h1>
          <p className="text-zinc-400 mb-8">Sign in to start chatting, save your history, and access advanced AI models with web search capabilities.</p>
          <button 
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-lime-400 text-black font-semibold rounded-xl hover:bg-lime-500 transition-colors flex items-center justify-center gap-2"
          >
            <User size={20} />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const filteredConversations = conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-screen bg-[#111] text-zinc-100 font-sans overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-lime-500/10 blur-[100px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] rounded-full bg-teal-500/10 blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-[260px]' : 'w-0'} transition-all duration-300 flex-shrink-0 bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col overflow-hidden z-20`}>
        <div className="p-3 pb-0">
          <button 
            onClick={startNewChat}
            className="flex items-center gap-2 w-full p-2.5 rounded-lg hover:bg-lime-400/10 hover:text-lime-400 transition-colors text-sm font-medium group"
          >
            <div className="w-7 h-7 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center">
              <Plus size={16} />
            </div>
            New Chat
          </button>
        </div>
        
        <div className="px-3 py-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800 text-sm text-zinc-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1">
          {filteredConversations.map(convo => (
            <button 
              key={convo.id}
              onClick={() => setCurrentConversationId(convo.id)}
              className={`flex items-center justify-between w-full p-2 rounded-lg transition-colors text-sm text-left group ${currentConversationId === convo.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MessageSquare size={16} className={`flex-shrink-0 ${currentConversationId === convo.id ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
                <span className={`truncate ${currentConversationId === convo.id ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                  {convo.title}
                </span>
              </div>
              <Trash2 
                size={14} 
                onClick={(e) => handleDeleteConversation(e, convo.id)}
                className="flex-shrink-0 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all" 
              />
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={user.photoURL || ''} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full bg-zinc-800" />
            <div className="text-sm font-medium truncate">{user.displayName || 'User'}</div>
          </div>
          <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 z-10">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 z-10 bg-transparent">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-lime-400 transition-colors">
              <Menu size={20} />
            </button>
            
            {/* Model Selector */}
            <div className="relative group">
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="appearance-none bg-transparent hover:bg-zinc-800 rounded-lg py-1.5 pl-3 pr-8 text-lg font-semibold cursor-pointer focus:outline-none transition-colors text-zinc-200"
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id} className="bg-zinc-800 text-sm">{m.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
            </div>
          </div>

          {/* Clear Chat History Button */}
          {currentConversationId && (
            <button 
              onClick={(e) => handleDeleteConversation(e, currentConversationId)}
              className="p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 hover:text-lime-400 transition-colors flex items-center gap-2 text-sm font-medium"
              title="Clear Chat History"
            >
              <Brush size={18} />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
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
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-emerald-600'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
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
                      <div className={`px-5 py-3.5 rounded-3xl ${msg.role === 'user' ? 'bg-zinc-800 text-zinc-100' : 'bg-transparent text-zinc-100'}`}>
                        {msg.role === 'user' ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <div className="prose prose-invert prose-zinc max-w-none prose-p:leading-relaxed prose-pre:bg-[#0d0d0d] prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
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
                className="w-full max-h-48 min-h-[56px] bg-transparent text-zinc-100 placeholder-zinc-400 resize-none py-4 pl-5 pr-12 focus:outline-none rounded-3xl"
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
                    onClick={() => {
                      setComposioEnabled(!composioEnabled);
                      if (!composioEnabled) {
                        setWebSearch(false);
                        setLiveBrowser(false);
                      }
                    }}
                    className={`p-2 rounded-full transition-colors flex items-center gap-2 ${composioEnabled ? 'text-purple-400 bg-purple-400/10' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'}`}
                    title="Social Media Tools (Composio)"
                  >
                    <Share2 size={20} />
                    {composioEnabled && <span className="text-xs font-medium pr-1">Social Tools</span>}
                  </button>
                </div>
                
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && attachments.length === 0) || isLoading}
                  className="p-2 rounded-full bg-lime-400 text-black hover:bg-lime-500 disabled:opacity-50 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:hover:bg-zinc-700 transition-colors flex items-center justify-center w-10 h-10"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                </button>
              </div>
            </div>
            <div className="text-center mt-3">
              <span className="text-xs text-zinc-500">AI can make mistakes. Consider verifying important information.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
