import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-18 left-4 right-4 sm:left-auto sm:right-6 z-40 flex items-center justify-between gap-3 rounded-2xl bg-slate-900/90 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-white shadow-xl border border-white/10 animate-bounce">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
        <span>Mode Hors-ligne — Catalogue local 100% fonctionnel</span>
      </div>
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
    </div>
  );
};
