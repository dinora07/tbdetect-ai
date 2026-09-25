import React from 'react';
import { X, Mail, Phone, MapPin, Send, Shield, Briefcase, Camera, Edit3, CheckCircle2, Copy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ProfileDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit: () => void;
  onOpenChangeAvatar: () => void;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  isOpen,
  onClose,
  onOpenEdit,
  onOpenChangeAvatar,
}) => {
  const { user } = useAuth();
  const { success } = useToast();

  if (!isOpen || !user) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success(`${label} copied to clipboard`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
        {/* Cover / Header */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4 pt-2">
            <div className="relative group">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover border-2 border-white/80 shadow-md ring-2 ring-white/20"
              />
              <button
                onClick={() => {
                  onClose();
                  onOpenChangeAvatar();
                }}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Change photo"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight truncate">{user.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-xs">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium mt-0.5 truncate">
                {user.title || user.specialty || 'Medical AI Specialist'}
              </p>
              <p className="text-[11px] text-blue-200/80 mt-0.5 truncate">{user.clinicName}</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Bio statement */}
          {user.bio && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{user.bio}</p>
            </div>
          )}

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-center justify-between group">
              <div className="flex items-center gap-2.5 min-w-0">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                  <p className="text-slate-800 font-semibold truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(user.email, 'Email')}
                className="p-1 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy email"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-center justify-between group">
              <div className="flex items-center gap-2.5 min-w-0">
                <Send className="w-4 h-4 text-sky-500 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Telegram</p>
                  <p className="text-slate-800 font-semibold truncate">{user.telegram || '@javaa_backend'}</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(user.telegram || '@javaa_backend', 'Telegram')}
                className="p-1 text-slate-400 hover:text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy Telegram handle"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-center justify-between group">
              <div className="flex items-center gap-2.5 min-w-0">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Phone</p>
                  <p className="text-slate-800 font-semibold truncate">{user.phone || '+998 90 123 4567'}</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(user.phone || '+998 90 123 4567', 'Phone')}
                className="p-1 text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy phone"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Location</p>
                  <p className="text-slate-800 font-semibold truncate">{user.region || 'Tashkent, Uzbekistan'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* System & Security Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              2FA Authenticator Active
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-bold border border-indigo-200">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              Admin Security Clearance
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-mono font-medium">
              ID: {user.id}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenChangeAvatar();
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Change Photo</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenEdit();
              }}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
