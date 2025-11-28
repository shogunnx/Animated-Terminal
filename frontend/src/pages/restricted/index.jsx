import React, { useState } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function RestrictedPage() {
  const [access, setAccess] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('ACCESS DENIED: INSUFFICIENT CLEARANCE');
    // Shake effect could be added here
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="max-w-md w-full bg-black/60 border border-red-500/50 p-8 rounded-sm shadow-[0_0_50px_rgba(220,38,38,0.2)] text-center relative overflow-hidden">
        {/* Glitch Overlay */}
        <div className="absolute inset-0 bg-red-500/5 pointer-events-none animate-pulse"></div>
        
        <div className="relative z-10">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-red-500 uppercase tracking-widest mb-2">Restricted Access</h2>
          <p className="text-red-400/70 text-sm font-mono mb-8">LEVEL 5 CLEARANCE REQUIRED</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-red-500/30 p-3 text-center text-red-500 outline-none focus:border-red-500 transition-colors font-mono placeholder:text-red-900"
                placeholder="ENTER PASSCODE"
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-xs font-bold animate-pulse flex items-center justify-center gap-2">
                <AlertTriangle className="w-3 h-3" /> {error}
              </div>
            )}
            
            <Button type="submit" variant="destructive" className="w-full bg-red-900/50 hover:bg-red-900 border border-red-500/50">
              AUTHENTICATE
            </Button>
          </form>
          
          <div className="mt-8 text-[10px] text-red-900 font-mono">
            IP LOGGED: 192.168.X.X <br/>
            ATTEMPT 1 OF 3
          </div>
        </div>
      </div>
    </div>
  );
}
