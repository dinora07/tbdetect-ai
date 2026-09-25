import React from 'react';
import { Activity } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Processing clinical tensor data...',
  submessage = 'Connecting to TBDetect AI inference neural network',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 animate-pulse">
          <Activity className="w-7 h-7 animate-spin" />
        </div>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-500 rounded-full animate-ping" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800 tracking-tight">{message}</p>
        <p className="text-xs text-slate-500 mt-0.5">{submessage}</p>
      </div>
    </div>
  );
};
