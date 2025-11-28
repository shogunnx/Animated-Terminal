import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Cpu, Database, Battery } from 'lucide-react';
import { nexusClient } from '../services/nexusClient';

export default function StatusPanel() {
  const [status, setStatus] = useState({
    system: 'ONLINE',
    cpu: 12,
    memory: 45,
    nexus: 'CONNECTED'
  });

  useEffect(() => {
    const ping = async () => {
      // Use the new ping method which checks multiple endpoints
      const results = await nexusClient.ping();
      // Check if any endpoint is reachable (status 200)
      const isConnected = results.some(r => r.ok && r.status === 200);
      
      setStatus((prev) => ({
        ...prev,
        nexus: isConnected ? "CONNECTED" : "DISCONNECTED",
        system: isConnected ? "ONLINE" : "OFFLINE",
        cpu: Math.floor(Math.random() * 30) + 10,
        memory: Math.floor(Math.random() * 20) + 40,
      }));
    };

    ping();
    const t = setInterval(ping, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="border border-primary/30 bg-primary/5 p-4 rounded-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 animate-pulse"></div>
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" /> System Status
        </h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>CORE_CPU</span>
              <span>{status.cpu}%</span>
            </div>
            <div className="h-1 bg-secondary/20 w-full rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${status.cpu}%` }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>MEMORY_ALLOC</span>
              <span>{status.memory}%</span>
            </div>
            <div className="h-1 bg-secondary/20 w-full rounded-full overflow-hidden">
              <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${status.memory}%` }}></div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-primary/20 pt-3 mt-2">
            <span className="text-muted-foreground">NEXUS_BRIDGE</span>
            <span className={`font-bold flex items-center gap-1 ${status.nexus === 'CONNECTED' ? 'text-green-400' : 'text-red-500'}`}>
              <Wifi className="w-3 h-3" /> {status.nexus}
            </span>
          </div>
        </div>
      </div>

      <div className="border border-primary/30 bg-primary/5 p-4 rounded-sm flex-1">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <Database className="w-4 h-4" /> Recent Logs
        </h3>
        <div className="space-y-2 font-mono text-[10px] text-muted-foreground">
          <div className="flex gap-2">
            <span className="text-primary">10:42:01</span>
            <span>System boot sequence initiated.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">10:42:05</span>
            <span>Nexus link established.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">10:42:12</span>
            <span>User authentication verified.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">10:45:00</span>
            <span>Scanning for anomalies...</span>
          </div>
          <div className="flex gap-2 opacity-50">
            <span className="text-primary">--:--:--</span>
            <span>Waiting for input...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
