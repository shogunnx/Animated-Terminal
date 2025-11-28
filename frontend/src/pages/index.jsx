import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Users, Shield, Database } from 'lucide-react';
import TerminalWindow from '../components/TerminalWindow';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Sisters", value: "5", icon: Users, color: "text-purple-400" },
          { label: "System Integrity", value: "98.4%", icon: Activity, color: "text-green-400" },
          { label: "Threat Level", value: "MODERATE", icon: Shield, color: "text-yellow-400" },
          { label: "Data Archives", value: "14.2 TB", icon: Database, color: "text-blue-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-primary/5 border border-primary/20 p-4 rounded-sm flex items-center justify-between hover:bg-primary/10 transition-colors group">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              <div className={`text-2xl font-bold font-mono mt-1 ${stat.color} group-hover:scale-105 transition-transform`}>{stat.value}</div>
            </div>
            <stat.icon className={`w-8 h-8 opacity-50 ${stat.color}`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        <TerminalWindow title="SYSTEM_LOGS" className="lg:col-span-2">
          <div className="space-y-2 font-mono text-sm text-primary/80">
            <p className="text-yellow-500">[WARNING] Unsanctioned energy spike detected in Sector 7.</p>
            <p>[INFO] Wargirl training simulation completed. Efficiency: 94%.</p>
            <p>[INFO] Victoria Black requested access to 'Project: Divinity'.</p>
            <p className="text-red-500">[ALERT] Binary firewall breach attempt blocked.</p>
            <p>[INFO] Daily maintenance cycle scheduled for 0300.</p>
            <p>[INFO] New timeline branch detected: ID #8821-B.</p>
            <p>[INFO] Harmony synchronization rate at 99.9%.</p>
            <p className="text-muted-foreground">... Load more logs ...</p>
          </div>
        </TerminalWindow>

        <div className="space-y-4">
          <div className="border border-primary/30 bg-black/40 p-4 rounded-sm h-full flex flex-col">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 border-b border-primary/20 pb-2">Quick Access</h3>
            <div className="flex-1 space-y-2">
              <Link to="/rooms/victoria_black" className="block p-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-sm text-primary transition-colors">
                &gt; ENTER VICTORIA'S ROOM
              </Link>
              <Link to="/rooms/wargirl" className="block p-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-sm text-primary transition-colors">
                &gt; ENTER WARGIRL'S ROOM
              </Link>
              <Link to="/timeline" className="block p-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-sm text-primary transition-colors">
                &gt; VIEW TIMELINE
              </Link>
              <Link to="/restricted" className="block p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-sm text-red-400 transition-colors">
                &gt; RESTRICTED AREA
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
