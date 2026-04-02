import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MessageSquare, Plus, Calendar, Code, ChevronDown, Search, Trash2, LogOut, Menu, User, BrainCircuit } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Conversation } from '../db';
import { ThemeSwitcher } from './ThemeSwitcher';

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
    <div
      className="flex h-screen font-sans overflow-hidden relative"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-blob" style={{ backgroundColor: 'var(--blob-color)' }} />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-blob animation-delay-2000" style={{ backgroundColor: 'var(--blob-color)' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] rounded-full blur-[120px] animate-blob animation-delay-4000" style={{ backgroundColor: 'var(--blob-color)' }} />
      </div>

      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-[260px]' : 'w-0'} transition-all duration-300 flex-shrink-0 glassmorphism flex flex-col overflow-hidden z-20`}
        style={{ borderRight: '1px solid var(--glass-border)' }}
      >
        <div className="p-3 pb-0 space-y-1">
          <Link 
            to="/"
            className={`flex items-center gap-3 w-full py-1.5 px-3 rounded-xl transition-all duration-300 text-sm font-medium group neumorphic-button glassmorphism ${location.pathname === '/' ? 'neumorphic-inset' : ''}`}
            style={{
              color: location.pathname === '/' ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ color: location.pathname === '/' ? 'var(--accent)' : 'var(--text-tertiary)' }}
            >
              <MessageSquare size={18} />
            </div>
            Chat
          </Link>

          <button 
            onClick={startNewChat}
            className="flex items-center gap-3 w-full py-1.5 px-3 rounded-xl transition-all duration-300 text-sm font-medium group neumorphic-button glassmorphism"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--accent)' }}>
              <Plus size={18} />
            </div>
            New Chat
          </button>

          <Link 
            to="/schedule"
            className={`flex items-center gap-3 w-full py-1.5 px-3 rounded-xl transition-all duration-300 text-sm font-medium group neumorphic-button glassmorphism ${location.pathname === '/schedule' ? 'neumorphic-inset' : ''}`}
            style={{
              color: location.pathname === '/schedule' ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ color: location.pathname === '/schedule' ? 'var(--accent)' : 'var(--text-tertiary)' }}
            >
              <Calendar size={18} />
            </div>
            Schedule Task
          </Link>
        </div>
        
        <div className="flex-1"></div>

        <div className="p-3 space-y-1" style={{ borderTop: '1px solid var(--border-secondary)' }}>
          <button 
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center justify-between w-full p-3 text-xs font-bold uppercase tracking-wider neumorphic-button glassmorphism"
            style={{ color: 'var(--accent)' }}
          >
            History
            <ChevronDown size={14} className={`transition-transform ${historyOpen ? '' : 'rotate-180'}`} />
          </button>
          {historyOpen && (
            <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
              <div className="px-3 pb-2 sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-sm rounded-xl pl-9 pr-3 py-2 focus:outline-none"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-secondary)',
                    }}
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
                    className={`flex items-center justify-between w-full p-3 rounded-xl transition-all duration-300 text-sm text-left group cursor-pointer ${currentConversationId === convo.id ? 'neumorphic-inset' : ''}`}
                    onMouseEnter={(e) => {
                      if (currentConversationId !== convo.id) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (currentConversationId !== convo.id) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <MessageSquare
                        size={16}
                        className="flex-shrink-0"
                        style={{ color: currentConversationId === convo.id ? 'var(--accent)' : 'var(--text-tertiary)' }}
                      />
                      <span
                        className="truncate"
                        style={{ color: currentConversationId === convo.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                      >
                        {convo.title}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, convo.id)}
                      className={`p-1.5 rounded-lg transition-all neumorphic-button ${currentConversationId === convo.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--danger-muted)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
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
          <div className="p-3" style={{ borderTop: '1px solid var(--border-secondary)' }}>
            <button
              onClick={() => setAutoLearnEnabled(!autoLearnEnabled)}
              className={`flex items-center justify-between w-full p-3 rounded-xl transition-all duration-300 text-sm font-medium group neumorphic-button glassmorphism ${autoLearnEnabled ? 'neumorphic-inset' : ''}`}
              style={{ color: autoLearnEnabled ? 'var(--accent)' : 'var(--text-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ color: autoLearnEnabled ? 'var(--accent)' : 'var(--text-tertiary)' }}
                >
                  <BrainCircuit size={18} className={autoLearnEnabled ? 'animate-pulse' : ''} />
                </div>
                Auto-Learning
              </div>
              <div
                className="w-10 h-5 rounded-full transition-colors relative"
                style={{ backgroundColor: autoLearnEnabled ? 'var(--accent)' : 'var(--bg-hover)' }}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${autoLearnEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                />
              </div>
            </button>
          </div>
        )}

        <div className="p-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-secondary)' }}>
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={user.photoURL || ''}
              alt=""
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}
            />
            <div className="text-sm font-bold truncate">{user.displayName || 'User'}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl transition-all duration-300 neumorphic-button glassmorphism"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--danger-muted)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 z-10">
        <header className="h-16 flex items-center justify-between px-6 z-10 bg-transparent">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 -ml-2 rounded-xl transition-all duration-300 neumorphic-button glassmorphism"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <Menu size={20} />
            </button>
          </div>
          <ThemeSwitcher />
        </header>
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
}
