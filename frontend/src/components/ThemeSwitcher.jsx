import React, { useEffect } from 'react';
import { Palette } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function ThemeSwitcher() {
  const setTheme = (theme) => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('tsv-theme', theme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('tsv-theme');
    if (savedTheme) {
      document.body.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const themes = [
    { id: 'victoria', name: 'Victoria (Default)', color: 'bg-purple-600' },
    { id: 'wargirl', name: 'Wargirl (Pink/Yellow)', color: 'bg-pink-500' },
    { id: 'binary', name: 'Binary (Neon)', color: 'bg-fuchsia-500' },
    { id: 'vanessa', name: 'Vanessa (Red/Gold)', color: 'bg-red-600' },
    { id: 'harmony', name: 'Harmony (Blue/White)', color: 'bg-cyan-400' },
    { id: 'evilvictoria', name: 'Evil (Black/Red)', color: 'bg-red-900' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 border-primary/30 hover:bg-primary/10 hover:text-primary">
          <Palette className="w-4 h-4" />
          <span>Change Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-primary/20">
        {themes.map((theme) => (
          <DropdownMenuItem 
            key={theme.id} 
            onClick={() => setTheme(theme.id)}
            className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
          >
            <div className={`w-3 h-3 rounded-full mr-2 ${theme.color}`} />
            {theme.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
