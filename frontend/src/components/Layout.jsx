import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Terminal, Users, Clock, ShieldAlert, Database, 
  Heart, Lock, ExternalLink, Home, Menu, X 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import StatusPanel from './StatusPanel';
import ThemeSwitcher from './ThemeSwitcher';

const NavItem = ({ to, icon: Icon, label, active, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group",
      active 
        ? "bg-primary/20 text-primary border-l-2 border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
    )}
  >
    <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active && "animate-pulse")} />
    <span className="font-mono tracking-wider text-sm uppercase">{label}</span>
  </Link>
);

const Navigation = ({ mobile = false, onItemClick }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const items = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/characters/victoria_black", icon: Users, label: "Characters" }, // Default to Victoria
    { to: "/timeline", icon: Clock, label: "Timeline" },
    { to: "/raids", icon: ShieldAlert, label: "Raids & Missions" },
    { to: "/evolutions", icon: Database, label: "Evolutions DB" },
    { to: "/relationships", icon: Heart, label: "Relationships" },
    { to: "/rooms/victoria_black", icon: Home, label: "Personal Rooms" }, // Default to Victoria
    { to: "/restricted", icon: Lock, label: "Restricted Files" },
  ];

  return (
    <nav className={cn("flex flex-col gap-2", mobile ? "mt-8" : "mt-4")}>
      {items.map((item) => (
        <NavItem 
          key={item.to} 
          {...item} 
          active={isActive(item.to)} 
          onClick={onItemClick}
        />
      ))}
      
      <div className="mt-8 px-4">
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-widest opacity-50">External Links</div>
        <a href="#" className="flex items-center gap-2 text-xs text-primary/70 hover:text-primary py-1">
          <ExternalLink className="w-3 h-3" /> WIKI.EXE
        </a>
        <a href="#" className="flex items-center gap-2 text-xs text-primary/70 hover:text-primary py-1">
          <ExternalLink className="w-3 h-3" /> NEXUS.SYSTEM
        </a>
      </div>
    </nav>
  );
};

export default function Layout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden relative">
      {/* Scanlines Overlay - Lower Z-index and ensure pointer-events-none */}
      <div className="scanlines pointer-events-none fixed inset-0 z-10 opacity-20"></div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur z-40 sticky top-0">
        <div className="flex items-center gap-2 text-primary">
          <Terminal className="w-6 h-6" />
          <span className="font-bold tracking-widest">TSV TERMINAL</span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] bg-background border-r border-primary/30 p-0">
            <div className="p-4 border-b border-primary/20">
              <div className="text-xl font-bold text-primary glitch-text" data-text="SYSTEM MENU">SYSTEM MENU</div>
            </div>
            <Navigation mobile onItemClick={() => setIsMobileOpen(false)} />
            <div className="absolute bottom-4 left-4 right-4">
              <ThemeSwitcher />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-background/50 backdrop-blur-sm h-screen sticky top-0 z-30">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.5)]">
            <Terminal className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="font-bold text-primary tracking-widest text-sm">TSV ARCHIVE</div>
            <div className="text-[10px] text-muted-foreground tracking-widest">V.2.0.4 ONLINE</div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <Navigation />
        </div>

        <div className="p-4 border-t border-border bg-background/80">
          <ThemeSwitcher />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-[calc(100vh-65px)] md:h-screen overflow-y-auto relative custom-scrollbar p-4 md:p-8">
        <div className="max-w-6xl mx-auto min-h-full flex flex-col">
          {children}
        </div>
      </main>

      {/* Right Status Panel (Desktop Only) */}
      <aside className="hidden xl:block w-72 border-l border-border bg-background/30 backdrop-blur-sm h-screen sticky top-0 p-4 z-30">
        <StatusPanel />
      </aside>
    </div>
  );
}
