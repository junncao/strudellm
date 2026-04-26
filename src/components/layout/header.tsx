"use client";

import { useState } from "react";
import { AuthButton } from "@/components/auth/auth-button";
import { InfoModal } from "@/components/info-modal";
import { Play, Square, RotateCcw } from "lucide-react";
import { useStrudel } from "@/strudel/context/strudel-provider";
import { useTambo } from "@tambo-ai/react";
import { cn } from "@/lib/utils";

export function Header() {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { isPlaying, isReady, play, stop, reset } = useStrudel();
  const { startNewThread } = useTambo();

  return (
    <>
      <header
        className="h-12 flex items-center justify-between px-5 shrink-0"
        style={{ background: "#ecffe4", borderBottom: "none" }}
      >
        {/* Left: branding */}
        <div className="flex items-center gap-3">
          <h1
            className="text-lg font-black tracking-tighter text-[#5c5f60]"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            <span style={{ color: "#2d6a4f" }}>Morning</span>Drift
          </h1>
        </div>

        {/* Center: transport controls */}
        <div className="flex items-center gap-1 bg-[#d6e8ce] rounded-full px-2 py-1">
          <TransportButton
            onClick={isPlaying ? stop : play}
            disabled={!isReady}
            active={isPlaying}
            title={isPlaying ? "Stop" : "Play"}
          >
            {isPlaying ? (
              <Square className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
          </TransportButton>
          <TransportButton
            onClick={() => { reset(); startNewThread(); }}
            disabled={!isReady}
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </TransportButton>
          {/* Status dot */}
          <div className="flex items-center gap-1.5 px-2">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                isPlaying
                  ? "bg-[#2d6a4f] shadow-[0_0_6px_#2d6a4f]"
                  : isReady
                  ? "bg-[#5c5f60]/40"
                  : "bg-[#735c00] animate-pulse"
              )}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5c5f60]/60">
              {!isReady ? "loading" : isPlaying ? "playing" : "stopped"}
            </span>
          </div>
        </div>

        {/* Right: auth */}
        <AuthButton />
      </header>

      {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
    </>
  );
}

function TransportButton({
  children,
  onClick,
  disabled,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "w-7 h-7 flex items-center justify-center rounded-full transition-all",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        active
          ? "bg-[#2d6a4f] text-white"
          : "text-[#5c5f60] hover:bg-[#894c5a]/10 hover:shadow-[0_0_8px_#ffe087]"
      )}
    >
      {children}
    </button>
  );
}
