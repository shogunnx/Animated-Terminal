import React from 'react';
import timelineData from '../../data/timeline.json';
import TerminalWindow from '../../components/TerminalWindow';

export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary uppercase tracking-tighter mb-8">Temporal Archives</h1>
      
      <div className="relative border-l-2 border-primary/30 ml-4 md:ml-8 space-y-12 pb-12">
        {timelineData.map((event, index) => (
          <div key={event.id} className="relative pl-8 md:pl-12 group">
            {/* Timeline Dot */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-primary group-hover:bg-primary group-hover:scale-125 transition-all shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
            
            <div className="bg-black/40 border border-primary/20 p-6 rounded-sm hover:border-primary/60 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl font-bold text-primary pointer-events-none">
                {index + 1}
              </div>
              
              <div className="text-sm text-secondary font-mono mb-2">{event.date}</div>
              <h3 className="text-xl font-bold text-primary uppercase mb-2">{event.title}</h3>
              <p className="text-muted-foreground">{event.description}</p>
              
              <div className="mt-4 pt-4 border-t border-primary/10 flex gap-2">
                <span className="text-xs bg-primary/10 px-2 py-1 rounded text-primary/70">ARCHIVE_ID: {event.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
