"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { TagGameTag } from "../_lib/taggame-tags";

export function CenterCluster({
  tags,
  isGenerating,
  isPlaying,
  canCook,
  onCook,
}: {
  tags: TagGameTag[];
  isGenerating: boolean;
  isPlaying: boolean;
  canCook: boolean;
  onCook: () => void;
}) {
  const active = tags.length > 0;

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full">
      <motion.div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full mix-blend-screen",
          active
            ? "bg-[radial-gradient(circle,_rgba(255,255,255,0.72)_0%,_rgba(254,240,138,0.24)_38%,_rgba(255,255,255,0.04)_68%,_transparent_100%)]"
            : "bg-[radial-gradient(circle,_rgba(255,255,255,0.68)_0%,_rgba(255,255,255,0.05)_62%,_transparent_100%)]",
        )}
        animate={
          isGenerating
            ? { scale: [1, 1.06, 0.98, 1.04, 1], opacity: [0.8, 1, 0.85, 1, 0.8] }
            : isPlaying
              ? { scale: [1, 1.04, 0.99, 1.03, 1], rotate: [0, 1.2, -1.2, 0] }
              : { scale: active ? [1, 1.02, 1] : 1, opacity: active ? [0.72, 0.92, 0.72] : 0.52 }
        }
        transition={{ duration: isGenerating ? 1.8 : 3.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="pointer-events-none absolute inset-[10%] rounded-full border border-white/25 bg-white/8 backdrop-blur-[8px] shadow-[0_16px_70px_rgba(255,255,255,0.18)]"
        animate={
          isGenerating
            ? { rotate: 360 }
            : isPlaying
              ? {
                  boxShadow: [
                    "0 16px 70px rgba(255,255,255,0.25)",
                    "0 22px 90px rgba(167,243,208,0.45)",
                    "0 18px 80px rgba(125,211,252,0.38)",
                    "0 16px 70px rgba(255,255,255,0.25)",
                  ],
                }
              : undefined
        }
        transition={
          isGenerating
            ? { duration: 12, repeat: Infinity, ease: "linear" }
            : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <button
          type="button"
          onClick={onCook}
          disabled={!canCook}
          className={cn(
            "pointer-events-auto relative z-40 rounded-full border px-5 py-3 text-xs font-black uppercase tracking-[0.24em] transition",
            canCook
              ? "border-white/85 bg-white/88 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.16)] hover:scale-[1.03] hover:bg-white"
              : "cursor-not-allowed border-white/45 bg-white/45 text-slate-400 shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
          )}
        >
          {isGenerating ? "Cooking" : "Cook"}
        </button>
      </div>
    </div>
  );
}
