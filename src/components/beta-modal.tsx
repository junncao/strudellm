"use client";

import { X } from "lucide-react";

interface BetaModalProps {
  onClose: () => void;
}

export function BetaModal({ onClose }: BetaModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-3">Welcome to LMDJ</h2>

        <p className="text-muted-foreground mb-4">
          This is a beta product and we&apos;re still polishing parts of the
          experience. You may encounter bugs or incomplete features.
        </p>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
