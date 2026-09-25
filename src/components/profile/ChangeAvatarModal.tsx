import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Trash2, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ChangeAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangeAvatarModal: React.FC<ChangeAvatarModalProps> = ({ isOpen, onClose }) => {
  const { user, updateAvatar } = useAuth();
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const currentAvatar = previewUrl || user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

  const handleFileChange = (file: File) => {
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      error('Invalid file format. Please upload JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error('File is too large. Maximum allowed size is 5MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setPreviewUrl(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    if (!previewUrl) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      updateAvatar(previewUrl);
      success('Profile photo updated successfully', 'Avatar Saved');
      onClose();
    } catch {
      error('Failed to update avatar photo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setPreviewUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');
    setSelectedFile(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Change Profile Photo</h3>
              <p className="text-xs text-slate-500">Upload a new avatar or portrait image</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group">
              <img
                src={currentAvatar}
                alt="Profile Preview"
                referrerPolicy="no-referrer"
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl ring-2 ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                title="Browse file"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-3">{user?.name || 'User'}</p>
            <p className="text-[11px] text-slate-400">{user?.role || 'SYSTEM_USER'}</p>
          </div>

          {/* Real Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-100 text-indigo-600">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Click to browse <span className="font-normal text-slate-500">or drag and drop</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, or WEBP up to 5MB</p>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold text-indigo-950 truncate">{selectedFile.name}</span>
                <span className="text-[10px] text-indigo-600 font-mono shrink-0">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="p-1 text-indigo-600 hover:text-rose-600 hover:bg-white rounded-md transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Default Photo
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
