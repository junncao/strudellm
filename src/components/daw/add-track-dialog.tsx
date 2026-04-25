"use client";

import * as React from "react";
import { useTracks } from "@/strudel/context/track-context";

type Props = {
  onClose: () => void;
};

export function AddTrackDialog({ onClose }: Props) {
  const { addNewTrack } = useTracks();
  const [name, setName] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addNewTrack(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-[#e7f9de] rounded-2xl p-6 w-80 shadow-xl">
        <h2
          className="text-lg font-black uppercase tracking-widest text-[#5c5f60] mb-4"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          Add Track
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5c5f60]/60 block mb-1.5">
              Track Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. bass, lead, pad..."
              className="w-full bg-white/70 rounded-xl px-3 py-2 text-sm text-[#111f0f] placeholder:text-[#5c5f60]/40 focus:outline-none focus:ring-2 focus:ring-[#ffe087]/60"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-[#5c5f60] bg-white/60 hover:bg-white/80 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-[#111f0f] bg-[#ffe087] hover:shadow-[0_0_12px_#ffe087] transition-all disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
