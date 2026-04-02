import React, { useState, useEffect, useRef } from 'react';
import { Palette, Check } from 'lucide-react';

export type Theme = 'Glass Morphism' | 'Cyberpunk' | 'Neumorphism' | 'Sleek Minimal' | 'Colorful';

export const THEMES: Theme[] = ['Neumorphism', 'Glass Morphism', 'Cyberpunk', 'Sleek Minimal', 'Colorful'];

// Preview swatches: [bg, accent, text]
const THEME_SWATCHES: Record<Theme, { bg: string; accent: string; secondary: string; label: string }> = {
  'Neumorphism': {
    bg: '#2d3035',
    accent: '#BEE639',
    secondary: '#25282c',
    label: 'Tactile dark with lime accents',
  },
  'Glass Morphism': {
    bg: '#0f172a',
    accent: '#38bdf8',
    secondary: '#1e293b',
    label: 'Frosted glass with sky blue',
  },
  'Cyberpunk': {
    bg: '#0a0a12',
    accent: '#ff2e97',
    secondary: '#1a1a2e',
    label: 'Neon-soaked digital noir',
  },
  'Sleek Minimal': {
    bg: '#f8f9fb',
    accent: '#4f46e5',
    secondary: '#ffffff',
    label: 'Clean light with indigo',
  },
  'Colorful': {
    bg: '#1a1020',
    accent: '#f59e0b',
    secondary: '#221530',
    label: 'Deep purple with warm amber',
  },
};

export const ThemeSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>('Neumorphism');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 text-[11px] font-bold uppercase tracking-wider neumorphic-button glassmorphism"
        style={{
          color: 'var(--accent)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <Palette size={14} />
        <span style={{ color: 'var(--text-secondary)' }}>Theme</span>
        {/* Active theme dot */}
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: THEME_SWATCHES[currentTheme].accent }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden shadow-2xl border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <div
            className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em]"
            style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-secondary)' }}
          >
            Select Theme
          </div>

          {THEMES.map((theme) => {
            const swatch = THEME_SWATCHES[theme];
            const isActive = currentTheme === theme;
            return (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className="w-full text-left px-3 py-2.5 flex items-center gap-3 transition-all duration-200 group"
                style={{
                  backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Color swatch preview */}
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden border flex"
                  style={{ borderColor: isActive ? swatch.accent : 'var(--border-secondary)' }}
                >
                  <div className="w-1/2 h-full" style={{ backgroundColor: swatch.bg }} />
                  <div className="w-1/2 h-full flex flex-col">
                    <div className="flex-1" style={{ backgroundColor: swatch.accent }} />
                    <div className="flex-1" style={{ backgroundColor: swatch.secondary }} />
                  </div>
                </div>

                {/* Theme info */}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[11px] font-bold tracking-wide"
                    style={{ color: isActive ? swatch.accent : 'var(--text-primary)' }}
                  >
                    {theme}
                  </div>
                  <div
                    className="text-[9px] truncate"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {swatch.label}
                  </div>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: swatch.accent, color: THEME_SWATCHES[theme].bg }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
