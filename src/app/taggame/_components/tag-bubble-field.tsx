"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { TagGameBubbleLayout } from "../_lib/taggame-layout";
import type { TagGameTag } from "../_lib/taggame-tags";

const tokenClasses: Record<TagGameTag["colorToken"], string> = {
  violet: "from-violet-300/95 via-fuchsia-200/90 to-white/85 text-violet-950 border-violet-200/75 shadow-violet-300/40",
  blue: "from-sky-300/95 via-blue-200/90 to-white/85 text-sky-950 border-sky-200/75 shadow-sky-300/40",
  pink: "from-pink-300/95 via-rose-200/90 to-white/85 text-rose-950 border-pink-200/75 shadow-pink-300/40",
  emerald: "from-emerald-300/95 via-teal-200/90 to-white/85 text-emerald-950 border-emerald-200/75 shadow-emerald-300/40",
  amber: "from-amber-300/95 via-orange-200/90 to-white/85 text-amber-950 border-amber-200/75 shadow-amber-300/40",
  lime: "from-lime-300/95 via-emerald-200/90 to-white/85 text-lime-950 border-lime-200/75 shadow-lime-300/40",
  sky: "from-sky-300/95 via-cyan-200/90 to-white/85 text-sky-950 border-sky-200/75 shadow-sky-300/40",
  rose: "from-rose-300/95 via-pink-200/90 to-white/85 text-rose-950 border-rose-200/75 shadow-rose-300/40",
  orange: "from-orange-300/95 via-amber-200/90 to-white/85 text-orange-950 border-orange-200/75 shadow-orange-300/40",
  teal: "from-teal-300/95 via-emerald-200/90 to-white/85 text-teal-950 border-teal-200/75 shadow-teal-300/40",
};

function buildSelectionTarget(index: number, count: number) {
  const centerY = 44.5;

  if (count <= 1) {
    return { x: 50, y: 37.5 };
  }

  if (count <= 5) {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
    const radiusX = count === 2 ? 8.2 : count === 3 ? 8.8 : count === 4 ? 9.6 : 10.1;
    const radiusY = count === 2 ? 5.9 : count === 3 ? 6.4 : count === 4 ? 6.8 : 7.2;
    return {
      x: 50 + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
    };
  }

  const firstRingCount = Math.min(5, count);
  if (index < firstRingCount) {
    const angle = -Math.PI / 2 + (index / firstRingCount) * Math.PI * 2;
    return {
      x: 50 + Math.cos(angle) * 10.3,
      y: centerY + Math.sin(angle) * 7.8,
    };
  }

  const outerIndex = index - firstRingCount;
  const outerCount = count - firstRingCount;
  const angle = -Math.PI / 2 + (outerIndex / outerCount) * Math.PI * 2;
  return {
    x: 50 + Math.cos(angle) * 13.8,
    y: centerY + Math.sin(angle) * 10.4,
  };
}

export function TagBubbleField({
  tags,
  selectedIds,
  onToggle,
  layout,
  children,
}: React.PropsWithChildren<{
  tags: TagGameTag[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  layout: Record<string, TagGameBubbleLayout>;
}>) {
  const selectedIndex = new Map(selectedIds.map((id, index) => [id, index]));

  return (
    <div className="relative h-full min-h-[48rem] w-full overflow-hidden rounded-[2.5rem] border border-white/35 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9)_0%,_rgba(219,234,254,0.72)_22%,_rgba(196,181,253,0.22)_48%,_rgba(255,255,255,0.2)_76%,_rgba(255,255,255,0.08)_100%)] shadow-[0_30px_140px_rgba(148,163,184,0.18)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.46)_0%,_rgba(255,255,255,0.12)_24%,_transparent_60%)]" />

      {children}

      {tags.map((tag) => {
        const base = layout[tag.id];
        const index = selectedIndex.get(tag.id);
        const isSelected = index !== undefined;
        const selectedTarget = isSelected
          ? buildSelectionTarget(index, selectedIds.length)
          : null;

        return (
          <motion.button
            key={tag.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(tag.id)}
            className={cn(
              "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-gradient-to-br px-3 py-2 text-left font-semibold backdrop-blur-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/60",
              tokenClasses[tag.colorToken],
              tag.kind === "style"
                ? "text-[13px] shadow-[0_22px_60px_rgba(59,130,246,0.18)]"
                : tag.kind === "custom"
                  ? "text-[10px] shadow-[0_18px_44px_rgba(15,23,42,0.12)]"
                  : "text-[10px] shadow-[0_18px_44px_rgba(15,23,42,0.12)]",
              isSelected ? "z-[70] border-white/90" : "z-10 hover:z-20",
            )}
            style={{ width: tag.kind === "style" ? "7.4rem" : tag.kind === "custom" ? "8.5rem" : "6.2rem" }}
            initial={false}
            animate={{
              left: `${selectedTarget?.x ?? base.x}%`,
              top: `${selectedTarget?.y ?? base.y}%`,
              scale: isSelected ? 1.04 : base.scale,
            }}
            transition={{ type: "spring", stiffness: 160, damping: 18, mass: 0.75 }}
          >
            <motion.div
              animate={{
                x: [0, base.floatX, 0, -base.floatX * 0.6, 0],
                y: [0, -base.floatY, 0, base.floatY * 0.65, 0],
                rotate: [0, 1.8, 0, -1.8, 0],
              }}
              transition={{
                duration: base.duration,
                delay: base.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "block rounded-full",
                    tag.kind === "style" ? "h-3 w-3" : "h-2.5 w-2.5",
                    isSelected ? "bg-slate-900/70" : "bg-white/75",
                  )}
                />
                <div>
                  <div className="max-w-[11rem] truncate leading-none">{tag.label}</div>
                  <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.24em] text-slate-700/60">
                    {tag.kind === "style" ? "style" : tag.kind === "custom" ? "custom" : tag.category}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
}
