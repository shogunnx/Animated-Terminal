import React from 'react';
import raidsData from '../../data/raids.json';
import { ShieldAlert, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function RaidsPage() {
  const getStatusIcon = (status) => {
    switch(status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary uppercase tracking-tighter">Mission Logs</h1>

      <div className="grid gap-4">
        {raidsData.map((raid) => (
          <div key={raid.id} className="bg-black/40 border border-primary/20 p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-primary/5 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded border border-primary/20">
                <ShieldAlert className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-primary">{raid.name}</h3>
                  <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 border border-primary/20 rounded">
                    {raid.id}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Status:</span>
                  <span className="flex items-center gap-1 font-bold">
                    {getStatusIcon(raid.status)} {raid.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:items-end gap-2 text-sm">
              <div className="text-muted-foreground">
                Participants: <span className="text-primary">{raid.participants.join(", ")}</span>
              </div>
              <div className="text-muted-foreground">
                Outcome: <span className="text-secondary">{raid.outcome}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
