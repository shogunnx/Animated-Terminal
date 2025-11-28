import React from 'react';
import evolutionsData from '../../data/evolutions.json';
import { Zap } from 'lucide-react';

export default function EvolutionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary uppercase tracking-tighter">Evolution Database</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {evolutionsData.map((evo, i) => (
          <div key={i} className="bg-black/40 border border-primary/30 p-6 rounded-sm relative overflow-hidden group hover:border-primary/60 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
              <Zap className="w-12 h-12 text-primary" />
            </div>
            
            <h3 className="text-xl font-bold text-primary mb-1">{evo.character}</h3>
            <div className="text-2xl font-black text-secondary mb-4 uppercase tracking-widest">{evo.form}</div>
            
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between border-b border-primary/10 pb-1">
                <span className="text-muted-foreground">Trigger</span>
                <span className="text-primary">{evo.trigger}</span>
              </div>
              <div className="flex justify-between border-b border-primary/10 pb-1">
                <span className="text-muted-foreground">Power Level</span>
                <span className="text-primary">{evo.powerLevel}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-primary/20">
              <button className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs uppercase tracking-widest border border-primary/30 transition-colors">
                View Analysis
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
