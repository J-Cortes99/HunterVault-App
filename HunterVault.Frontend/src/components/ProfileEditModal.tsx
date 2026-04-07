import React, { useState, useEffect } from 'react';
import { X, User, Image as ImageIcon, AlignLeft, Loader2, Save } from 'lucide-react';
import type { UserProfile, UpdateProfilePayload } from '../types';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (payload: UpdateProfilePayload) => Promise<void>;
}

export function ProfileEditModal({ isOpen, onClose, profile, onSave }: ProfileEditModalProps) {
  const [formData, setFormData] = useState<UpdateProfilePayload>({
    bio: '',
    avatarUrl: '',
    bannerUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        bannerUrl: profile.bannerUrl || '',
      });
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="glass relative w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
          <div className="flex items-center gap-2">
            <User size={20} className="text-amber-500" />
            <h2 className="font-display text-xl font-bold text-white">Editar Perfil</h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar URL */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <ImageIcon size={14} />
              URL del Avatar
            </label>
            <input
              type="url"
              value={formData.avatarUrl}
              onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
              placeholder="https://ejemplo.com/mi-foto.png"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-all placeholder:text-slate-600 focus:border-amber-500/50 focus:bg-white/10 focus:outline-none"
            />
          </div>

          {/* Banner URL (Optional extra) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <ImageIcon size={14} />
              URL del Banner
            </label>
            <input
              type="url"
              value={formData.bannerUrl}
              onChange={e => setFormData({ ...formData, bannerUrl: e.target.value })}
              placeholder="https://ejemplo.com/mi-banner.png"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-all placeholder:text-slate-600 focus:border-amber-500/50 focus:bg-white/10 focus:outline-none"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <AlignLeft size={14} />
              Biografía
            </label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Escribe algo sobre ti..."
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-all placeholder:text-slate-600 focus:border-amber-500/50 focus:bg-white/10 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
