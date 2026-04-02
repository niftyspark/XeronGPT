import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MessageSquare, Plus, Calendar, Code, ChevronDown, Search, Trash2, LogOut, Menu, User, BrainCircuit } from 'lucide-react';
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
  autoLearnEnabled?: boolean;
  setAutoLearnEnabled?: (enabled: boolean) => void;
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
  setSearchQuery,
  autoLearnEnabled = false,
  setAutoLearnEnabled
}: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#2d3035] text-zinc-100 font-sans overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#BEE639]/5 blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#BEE639]/5 blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] rounded-full bg-[#BEE639]/5 blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-[260px]' : 'w-0'} transition-all duration-300 flex-shrink-0 bg-[#2d3035] border-r border-[#25282c] flex flex-col overflow-hidden z-20 shadow-[4px_0_10px_#25282c]`}>
        <div className="p-3 pb-0 space-y-1">
          <Link 
            to="/"
            className={`flex items-center gap-3 w-full py-1.5 px-3 rounded-xl transition-all duration-300 text-sm font-medium group neumorphic-button glassmorphism ${location.pathname === '/' ? 'neumorphic-inset text-[#BEE639]' : 'hover:bg-[#35383e] text-zinc-400 hover:text-zinc-100'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${location.pathname === '/' ? 'text-[#BEE639]' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
              <MessageSquare size={18} />
            </div>
            Chat
          </Link>

          <button 
            onClick={startNewChat}
            className="flex items-center gap-3 w-full py-1.5 px-3 rounded-xl hover:bg-[#35383e] hover:text-[#BEE639] transition-all duration-300 text-sm font-medium group neumorphic-button glassmorphism"
          >
            <div className="w-8 h-8 rounded-lg text-[#BEE639] flex items-center justify-center">
              <Plus size={18} />
            </div>
            New Chat
          </button>

          <Link 
            to="/schedule"
            className={`flex items-center gap-3 w-full py-1.5 px-3 rounded-xl transition-all duration-300 text-sm font-medium group neumorphic-button glassmorphism ${location.pathname === '/schedule' ? 'neumorphic-inset text-[#BEE639]' : 'hover:bg-[#35383e] text-zinc-400 hover:text-zinc-100'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${location.pathname === '/schedule' ? 'text-[#BEE639]' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
              <Calendar size={18} />
            </div>
            Schedule Task
          </Link>
        </div>
        
        <div className="flex-1"></div>

        <div className="p-3 space-y-1 border-t border-[#35383e]">
          <button 
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center justify-between w-full p-3 text-xs font-bold text-[#BEE639] hover:text-[#BEE639]/80 uppercase tracking-wider neumorphic-button glassmorphism"
          >
            History
            <ChevronDown size={14} className={`transition-transform ${historyOpen ? '' : 'rotate-180'}`} />
          </button>
          {historyOpen && (
            <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
              <div className="px-3 pb-2 sticky top-0 bg-[#2d3035] z-10">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#25282c] text-sm text-zinc-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#BEE639]/50"
                  />
                </div>
              </div>
              <div className="px-3 space-y-1">
                {filteredConversations.map(convo => (
                  <div 
                    key={convo.id}
                    onClick={() => {
                      setCurrentConversationId(convo.id);
                      navigate('/');
                    }}
                    className={`flex items-center justify-between w-full p-3 rounded-xl transition-all duration-300 text-sm text-left group cursor-pointer ${currentConversationId === convo.id ? 'neumorphic-inset' : 'hover:bg-[#35383e]/50'}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <MessageSquare size={16} className={`flex-shrink-0 ${currentConversationId === convo.id ? 'text-[#BEE639]' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                      <span className={`truncate ${currentConversationId === convo.id ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                        {convo.title}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, convo.id)}
                      className={`p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all neumorphic-button ${currentConversationId === convo.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      title="Delete Chat"
                    >
                      <Trash2 size={14} className="flex-shrink-0" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {setAutoLearnEnabled && (
          <div className="p-3 border-t border-[#35383e]">
            <button
              onClick={() => setAutoLearnEnabled(!autoLearnEnabled)}
              className={`flex items-center justify-between w-full p-3 rounded-xl transition-all duration-300 text-sm font-medium group neumorphic-button glassmorphism ${autoLearnEnabled ? 'neumorphic-inset text-[#BEE639]' : 'hover:bg-[#35383e] text-zinc-400 hover:text-zinc-100'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${autoLearnEnabled ? 'text-[#BEE639]' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                  <BrainCircuit size={18} className={autoLearnEnabled ? 'animate-pulse' : ''} />
                </div>
                Auto-Learning
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors relative ${autoLearnEnabled ? 'bg-[#BEE639]' : 'bg-[#35383e]'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[#2d3035] transition-transform ${autoLearnEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        )}

        <div className="p-4 border-t border-[#35383e] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={user.photoURL || ''} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-xl bg-[#25282c] border border-[#35383e]" />
            <div className="text-sm font-bold truncate">{user.displayName || 'User'}</div>
          </div>
          <button onClick={handleLogout} className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-300 neumorphic-button glassmorphism">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 z-10">
        <header className="h-16 flex items-center justify-between px-6 z-10 bg-transparent">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 -ml-2 rounded-xl hover:bg-[#35383e] text-zinc-400 hover:text-[#BEE639] transition-all duration-300 neumorphic-button glassmorphism">
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
