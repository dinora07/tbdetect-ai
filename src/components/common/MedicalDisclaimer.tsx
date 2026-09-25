import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface MedicalDisclaimerProps {
  variant?: 'banner' | 'compact' | 'footer' | 'prominent';
  className?: string;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { t } = useLanguage();

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/80 ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>{t.brand.disclaimerShort}</span>
      </div>
    );
  }

  if (variant === 'prominent') {
    return (
      <div className={`flex items-start gap-3 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl text-amber-900 shadow-xs ${className}`}>
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <p className="font-semibold text-amber-950">Clinical Decision Support Notice</p>
          <p className="text-amber-800/90 leading-relaxed">{t.brand.disclaimerFull}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between text-xs text-slate-500 bg-slate-50 border-t border-slate-200 py-2.5 px-4 ${className}`}>
      <div className="flex items-center gap-2 max-w-4xl mx-auto text-center justify-center">
        <AlertCircle className="w-4 h-4 text-cyan-600 shrink-0" />
        <span>{t.brand.disclaimerFull}</span>
      </div>
    </div>
  );
};
