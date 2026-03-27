import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Bot, User } from 'lucide-react';
import { streamChat, DEFAULT_MODEL, AppMessage, handleFileUpload, Attachment, performAutonomousLearning } from './api';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { subscribeToConversations, subscribeToMessages, createConversation, saveMessage, deleteConversation, Conversation, subscribeToMemory } from './db';
import Canvas from './components/Canvas';
import ScheduleTask from './components/ScheduleTask';
import MainLayout from './components/MainLayout';
import ChatPage from './components/ChatPage';
import ConfirmModal from './components/ConfirmModal';
import { Toaster, toast } from 'sonner';

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [currentMemory, setCurrentMemory] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [webSearch, setWebSearch] = useState(false);
  const [liveBrowser, setLiveBrowser] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [autoLearnEnabled, setAutoLearnEnabled] = useState(false);
  
  // Modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [convoToDelete, setConvoToDelete] = useState<string | null>(null);
  
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
    if (currentConversationId && user) {
      const unsubscribe = subscribeToMessages(currentConversationId, user.uid, (dbMsgs) => {
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
  }, [currentConversationId, user]);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToMemory(user.uid, (mem) => {
        if (mem) {
          setCurrentMemory(mem.content);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!autoLearnEnabled || !user) return;

    // Run every 60 seconds for demonstration purposes
    const intervalId = setInterval(async () => {
      try {
        const newSkill = await performAutonomousLearning(user.uid, currentMemory, selectedModel);
        if (newSkill) {
          toast.success(`🧠 AI learned a new skill: ${newSkill.substring(0, 60)}...`);
        }
      } catch (error) {
        console.error("Auto-learn error:", error);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [autoLearnEnabled, user, currentMemory, selectedModel]);

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
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    navigate('/');
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConvoToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteConversation = async () => {
    if (!convoToDelete) return;
    const id = convoToDelete;
    const previousConversations = [...conversations];
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      startNewChat();
    }

    try {
      await deleteConversation(id);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      setConversations(previousConversations);
      // We should probably use a toast here, but for now console.error is fine
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || !user) return;

    setIsLoading(true);
    abortControllerRef.current = new AbortController();
    const currentInput = input;
    const currentAttachments = [...attachments];

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

    await saveMessage(convoId, user.uid, 'user', newUserMsg.content);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }]);

    try {
      const stream = streamChat([...messages, newUserMsg], {
        webSearch,
        liveBrowser,
        userId: user.uid,
        currentMemory,
        model: selectedModel
      }, abortControllerRef.current.signal);
      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { ...msg, content: fullContent }
            : msg
        ));
      }
      await saveMessage(convoId, user.uid, 'assistant', fullContent);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Generation aborted');
      } else {
        console.error(error);
        const errorMsg = `**Error:** ${error.message}`;
        setMessages(prev => [...prev, { 
          id: (Date.now() + 2).toString(), 
          role: 'assistant', 
          content: errorMsg 
        }]);
        await saveMessage(convoId, user.uid, 'assistant', errorMsg);
      }
    } finally {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      abortControllerRef.current = null;
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

  return (
    <>
      <Routes>
        <Route path="/*" element={
          <MainLayout
            user={user}
            conversations={conversations}
            currentConversationId={currentConversationId}
            setCurrentConversationId={setCurrentConversationId}
            startNewChat={startNewChat}
            handleDeleteConversation={handleDeleteConversation}
            handleLogout={handleLogout}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            autoLearnEnabled={autoLearnEnabled}
            setAutoLearnEnabled={setAutoLearnEnabled}
          >
            <Routes>
              <Route path="/schedule" element={<ScheduleTask user={user} onBack={() => navigate('/')} />} />
              <Route path="/" element={
                <ChatPage
                  messages={messages}
                  input={input}
                  setInput={setInput}
                  isLoading={isLoading}
                  handleSend={handleSend}
                  stopGeneration={stopGeneration}
                  onFileChange={onFileChange}
                  attachments={attachments}
                  removeAttachment={removeAttachment}
                  webSearch={webSearch}
                  setWebSearch={setWebSearch}
                  liveBrowser={liveBrowser}
                  setLiveBrowser={setLiveBrowser}
                  setIsCanvasOpen={setIsCanvasOpen}
                  currentConversationId={currentConversationId}
                  handleDeleteConversation={handleDeleteConversation}
                  fileInputRef={fileInputRef}
                  textareaRef={textareaRef}
                  messagesEndRef={messagesEndRef}
                />
              } />
            </Routes>
          </MainLayout>
        } />
      </Routes>
      
      {isCanvasOpen && (
        <Canvas 
          onClose={() => setIsCanvasOpen(false)} 
          user={user} 
          currentMemory={currentMemory}
        />
      )}

      <ConfirmModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDeleteConversation}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
      <Toaster theme="dark" position="top-center" />
    </>
  );
}
