import React from 'react';
import relationshipsData from '../../data/relationships.json';

export default function RelationshipsPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <h1 className="text-3xl font-bold text-primary uppercase tracking-tighter">Relationship Matrix</h1>
      
      <div className="flex-1 bg-black/40 border border-primary/30 rounded-sm p-8 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-10 pointer-events-none">
           {/* Grid Background */}
           {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="border border-primary/20"></div>
          ))}
        </div>

        {/* Simple CSS Node Graph Visualization */}
        <div className="relative w-full h-full max-w-2xl max-h-[500px]">
          {/* Central Node */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-primary border-4 border-secondary shadow-[0_0_30px_rgba(var(--primary),0.8)] flex items-center justify-center font-bold text-primary-foreground z-20">
              VICTORIA
            </div>
          </div>

          {/* Satellite Nodes */}
          {relationshipsData.nodes.filter(n => n.id !== 'Victoria').map((node, i) => {
            const angle = (i / (relationshipsData.nodes.length - 1)) * 2 * Math.PI;
            const radius = 150; // px
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <React.Fragment key={node.id}>
                {/* Connection Line */}
                <div 
                  className="absolute top-1/2 left-1/2 h-0.5 bg-primary/30 origin-left z-0"
                  style={{
                    width: `${radius}px`,
                    transform: `translate(-50%, -50%) rotate(${angle * (180/Math.PI)}deg) translate(50%, 0)`
                  }}
                ></div>
                
                {/* Node */}
                <div 
                  className="absolute top-1/2 left-1/2 z-10 flex flex-col items-center transition-transform hover:scale-110 cursor-pointer"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                  }}
                >
                  <div className="w-14 h-14 rounded-full bg-black border-2 border-primary flex items-center justify-center text-xs font-bold text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                    {node.id}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
