import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';

export type Theme = 'Glass Morphism' | 'Cyberpunk' | 'Neumorphism' | 'Sleek Minimal' | 'Colorful';

export const THEMES: Theme[] = ['Glass Morphism', 'Cyberpunk', 'Neumorphism', 'Sleek Minimal', 'Colorful'];

export const ThemeSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>('Neumorphism');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 text-zinc-400 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-all duration-300 text-[10px] font-bold uppercase tracking-wider neumorphic-button"
      >
        <Palette size={12} />
        Theme
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-zinc-900 rounded-lg border border-zinc-700 shadow-xl overflow-hidden">
          {THEMES.map((theme) => (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className={`w-full text-left px-3 py-2 text-[10px] font-medium transition-colors ${
                currentTheme === theme ? 'bg-zinc-800 text-[#BEE639]' : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
