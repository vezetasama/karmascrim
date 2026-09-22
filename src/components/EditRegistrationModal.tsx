'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, User, Hash, Shield, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface EditRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  registration: {
    id: string; // registration db ID
    registrationId?: string; // registration string ID e.g. KS-REG-1234
    freeFireName?: string;
    freeFireUid?: string;
    teamName?: string;
    isSolo: boolean;
    roomReleased?: boolean;
  } | null;
}

export default function EditRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  registration,
}: EditRegistrationModalProps) {
  const [ign, setIgn] = useState('');
  const [uid, setUid] = useState('');
  const [teamName, setTeamName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (registration) {
      setIgn(registration.freeFireName || '');
      setUid(registration.freeFireUid || '');
      setTeamName(registration.teamName || '');
      setError(null);
      setSuccessMsg(null);
    }
  }, [registration, isOpen]);

  if (!isOpen || !registration) return null;

  const isSolo = registration.isSolo;
  const isRoomReleased = registration.roomReleased;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRoomReleased) {
      setError('Registration details cannot be updated after Room Code has been released by Admin.');
      return;
    }

    if (!ign.trim()) {
      setError('In-Game Name (IGN) is required.');
      return;
    }

    if (!uid.trim()) {
      setError('Free Fire UID is required.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/registrations/${registration.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeFireName: ign.trim(),
          freeFireUid: uid.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update registration details');
        setLoading(false);
        return;
      }

      setSuccessMsg('Details updated successfully!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('karma_refresh'));
      }
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError('Something went wrong updating registration details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#121722] border border-[#262F45] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF2E4C]/10 border border-[#FF2E4C]/30 text-[#FF2E4C] flex items-center justify-center">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Update Registration Details</h3>
            <p className="text-xs text-gray-400">
              {isRoomReleased
                ? 'Room Code is released. Registration details are now locked.'
                : 'Update your game details before Admin releases the Room Code.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {isRoomReleased ? (
          <div className="p-4 rounded-2xl bg-[#0B0E14] border border-[#262F45] text-xs text-amber-400 font-medium">
            🔒 Room Code has been released by Admin. Updating registration details is now locked for this tournament.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* PLAYER IGN */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF2E4C]" />
                <span>Player In-Game Name (IGN) <span className="text-red-400">*</span></span>
              </label>
              <input
                type="text"
                placeholder="e.g. KARMA_CHAMP"
                value={ign}
                onChange={(e) => setIgn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white focus:outline-none focus:border-[#FF2E4C]"
                required
              />
            </div>

            {/* PLAYER UID */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-400" />
                <span>Free Fire UID <span className="text-red-400">*</span></span>
              </label>
              <input
                type="text"
                placeholder="e.g. 2847102941"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white focus:outline-none focus:border-[#FF2E4C]"
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-gray-400 hover:text-white font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-[#FF2E4C] hover:bg-[#D61F3B] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md shadow-[#FF2E4C]/20"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
