"use client";

import { X } from "lucide-react";

interface InfoModalProps {
  onClose: () => void;
}

export function InfoModal({ onClose }: InfoModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-lg max-w-md w-full mx-4 p-6 text-zinc-50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">About LMDJ</h2>

        <div className="space-y-4 text-sm text-zinc-400 leading-6">
          <p>
            LMDJ is a live coding music playground with bubble-driven generation,
            chat-based composition, and a built-in arcade-style landing page.
          </p>
          <p>
            Use the TV menu to jump between mini-games, or head into Bubble Game
            and Chat Music to build loops directly.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-lg transition-colors text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
