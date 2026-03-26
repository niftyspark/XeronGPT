import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MessageSquare, Plus, Calendar, Code, ChevronDown, Search, Trash2, LogOut, Menu, User } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Conversation } from '../db';

interface MainLayoutProps {
  children: React.ReactNode;
  user: FirebaseUser;
  conversations: Conversation[];
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  startNewChat: () => void;
  handleDeleteConversation: (e: React.MouseEvent, id: string) => void;
  handleLogout: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function MainLayout({
  children,
  user,
  conversations,
  currentConversationId,
  setCurrentConversationId,
  startNewChat,
  handleDeleteConversation,
  handleLogout,
  searchQuery,
  setSearchQuery
}: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="p-3 pb-0 space-y-1">
          <Link 
            to="/"
            className={`flex items-center gap-2 w-full p-2.5 rounded-lg transition-colors text-sm font-medium group ${location.pathname === '/' ? 'bg-lime-400/10 text-lime-400' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100'}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${location.pathname === '/' ? 'bg-lime-400/20 text-lime-400' : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-400'}`}>
              <MessageSquare size={16} />
            </div>
            Chat
          </Link>

          <button 
            onClick={startNewChat}
            className="flex items-center gap-2 w-full p-2.5 rounded-lg hover:bg-lime-400/10 hover:text-lime-400 transition-colors text-sm font-medium group"
          >
            <div className="w-7 h-7 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center">
              <Plus size={16} />
            </div>
            New Chat
          </button>

          <Link 
            to="/schedule"
            className={`flex items-center gap-2 w-full p-2.5 rounded-lg transition-colors text-sm font-medium group ${location.pathname === '/schedule' ? 'bg-lime-400/10 text-lime-400' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100'}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${location.pathname === '/schedule' ? 'bg-lime-400/20 text-lime-400' : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-400'}`}>
              <Calendar size={16} />
            </div>
            Schedule Task
          </Link>

          <Link 
            to="/build"
            className={`flex items-center gap-2 w-full p-2.5 rounded-lg transition-colors text-sm font-medium group ${location.pathname === '/build' ? 'bg-lime-400/10 text-lime-400' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100'}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${location.pathname === '/build' ? 'bg-lime-400/20 text-lime-400' : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-400'}`}>
              <Code size={16} />
            </div>
            Build
          </Link>
        </div>
        
        <div className="flex-1"></div>

        <div className="p-3 space-y-1 border-t border-zinc-800">
          <button 
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center justify-between w-full p-2 text-sm font-medium text-zinc-400 hover:text-zinc-100"
          >
            Chat History
            <ChevronDown size={16} className={`transition-transform ${historyOpen ? '' : 'rotate-180'}`} />
          </button>
          {historyOpen && (
            <div className="mt-2 space-y-1 max-h-[300px] overflow-y-auto no-scrollbar">
              <div className="px-2 pb-2">
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
              {filteredConversations.map(convo => (
                <div 
                  key={convo.id}
                  onClick={() => {
                    setCurrentConversationId(convo.id);
                    navigate('/');
                  }}
                  className={`flex items-center justify-between w-full p-2 rounded-lg transition-colors text-sm text-left group cursor-pointer ${currentConversationId === convo.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <MessageSquare size={16} className={`flex-shrink-0 ${currentConversationId === convo.id ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
                    <span className={`truncate ${currentConversationId === convo.id ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                      {convo.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, convo.id)}
                    className={`p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all ${currentConversationId === convo.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    title="Delete Chat"
                  >
                    <Trash2 size={14} className="flex-shrink-0" />
                  </button>
                </div>
              ))}
            </div>
          )}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 z-10">
        <header className="h-14 flex items-center justify-between px-4 z-10 bg-transparent">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-lime-400 transition-colors">
              <Menu size={20} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
}
