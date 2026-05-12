"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  getTagGameBubbleDimensions,
  getTagGameBubbleFootprint,
  type TagGameBubbleLayout,
} from "../_lib/taggame-layout";
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

type SelectionSeat = {
  offsetXRem: number;
  offsetYRem: number;
};

const REM_IN_PX = 16;

const SELECTION_SEATS_BY_COUNT: Record<number, SelectionSeat[]> = {
  1: [{ offsetXRem: 0, offsetYRem: -5.7 }],
  2: [
    { offsetXRem: -4.9, offsetYRem: -4.8 },
    { offsetXRem: 4.9, offsetYRem: -4.8 },
  ],
  3: [
    { offsetXRem: 0, offsetYRem: -5.9 },
    { offsetXRem: -4.9, offsetYRem: 3.8 },
    { offsetXRem: 4.9, offsetYRem: 3.8 },
  ],
  4: [
    { offsetXRem: -5.1, offsetYRem: -4.9 },
    { offsetXRem: 5.1, offsetYRem: -4.9 },
    { offsetXRem: -5.1, offsetYRem: 3.9 },
    { offsetXRem: 5.1, offsetYRem: 3.9 },
  ],
  5: [
    { offsetXRem: 0, offsetYRem: -6.1 },
    { offsetXRem: -5.2, offsetYRem: -3.8 },
    { offsetXRem: 5.2, offsetYRem: -3.8 },
    { offsetXRem: -5.2, offsetYRem: 4.4 },
    { offsetXRem: 5.2, offsetYRem: 4.4 },
  ],
  6: [
    { offsetXRem: -5.3, offsetYRem: -5.1 },
    { offsetXRem: 5.3, offsetYRem: -5.1 },
    { offsetXRem: -6.6, offsetYRem: -0.5 },
    { offsetXRem: 6.6, offsetYRem: -0.5 },
    { offsetXRem: -5.3, offsetYRem: 4.5 },
    { offsetXRem: 5.3, offsetYRem: 4.5 },
  ],
  7: [
    { offsetXRem: 0, offsetYRem: -6.2 },
    { offsetXRem: -5.3, offsetYRem: -4.3 },
    { offsetXRem: 5.3, offsetYRem: -4.3 },
    { offsetXRem: -6.7, offsetYRem: 0.1 },
    { offsetXRem: 6.7, offsetYRem: 0.1 },
    { offsetXRem: -5.3, offsetYRem: 4.7 },
    { offsetXRem: 5.3, offsetYRem: 4.7 },
  ],
  8: [
    { offsetXRem: -3.7, offsetYRem: -6.0 },
    { offsetXRem: 3.7, offsetYRem: -6.0 },
    { offsetXRem: -6.2, offsetYRem: -2.8 },
    { offsetXRem: 6.2, offsetYRem: -2.8 },
    { offsetXRem: -6.2, offsetYRem: 1.9 },
    { offsetXRem: 6.2, offsetYRem: 1.9 },
    { offsetXRem: -3.7, offsetYRem: 5.0 },
    { offsetXRem: 3.7, offsetYRem: 5.0 },
  ],
};

function buildSelectionTarget(index: number, count: number, tags: TagGameTag[]) {
  const tag = tags[index];
  const dimensions = tag ? getTagGameBubbleDimensions(tag, "selected") : null;
  const halfHeightPx = dimensions ? dimensions.heightPx / 2 : 18;
  const seats = SELECTION_SEATS_BY_COUNT[count];

  if (seats && seats[index]) {
    const seat = seats[index];
    const topOffsetPx = seat.offsetYRem * REM_IN_PX - halfHeightPx;
    return {
      left: `calc(50% + ${seat.offsetXRem}rem)`,
      top: `calc(50% + ${topOffsetPx.toFixed(1)}px)`,
    };
  }

  const normalizedCount = Math.max(count, 1);
  const ringIndex = Math.floor(index / 8);
  const slotIndex = index % 8;
  const angle = -Math.PI / 2 + (slotIndex / 8) * Math.PI * 2 + ringIndex * 0.22;
  const radiusXRem = 6 + ringIndex * 1.2;
  const radiusYPx = (5.2 + ringIndex * 1.1) * REM_IN_PX;

  return {
    left: `calc(50% + ${(Math.cos(angle) * radiusXRem).toFixed(2)}rem)`,
    top: `calc(50% + ${(Math.sin(angle) * radiusYPx - halfHeightPx).toFixed(1)}px)`,
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
  const selectedTags = selectedIds
    .map((id) => tags.find((item) => item.id === id))
    .filter((item): item is TagGameTag => Boolean(item));

  return (
    <div className="relative h-full min-h-[48rem] w-full overflow-hidden rounded-[2.5rem] border border-white/35 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9)_0%,_rgba(219,234,254,0.72)_22%,_rgba(196,181,253,0.22)_48%,_rgba(255,255,255,0.2)_76%,_rgba(255,255,255,0.08)_100%)] shadow-[0_30px_140px_rgba(148,163,184,0.18)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.46)_0%,_rgba(255,255,255,0.12)_24%,_transparent_60%)]" />

      {children}

      {tags.map((tag) => {
        const base = layout[tag.id];
        const index = selectedIndex.get(tag.id);
        const isSelected = index !== undefined;
        const selectedTarget = isSelected
          ? buildSelectionTarget(index, selectedIds.length, selectedTags)
          : null;
        const dimensions = getTagGameBubbleDimensions(tag, isSelected ? "selected" : "field");

        return (
          <motion.button
            key={tag.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(tag.id)}
            className={cn(
              "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border bg-gradient-to-br px-2.5 py-1.5 text-left font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/60",
              tokenClasses[tag.colorToken],
              tag.kind === "style"
                ? "text-[11px] shadow-[0_18px_50px_rgba(59,130,246,0.18)]"
                : tag.kind === "custom"
                  ? "text-[9px] shadow-[0_16px_38px_rgba(15,23,42,0.12)]"
                  : "text-[9px] shadow-[0_16px_38px_rgba(15,23,42,0.12)]",
              isSelected ? "z-20 border-white/90" : "z-10 hover:z-20",
            )}
            style={{ width: `${dimensions.widthPx}px`, minHeight: `${dimensions.heightPx}px` }}
            initial={false}
            animate={{
              left: selectedTarget?.left ?? `${base.x}%`,
              top: selectedTarget?.top ?? `${base.y}%`,
              scale: isSelected ? 1.04 : base.scale,
              filter: isSelected
                ? "brightness(1)"
                : ["brightness(1)", "brightness(1.08)", "brightness(0.98)", "brightness(1.05)", "brightness(1)"],
              boxShadow: isSelected
                ? "0 22px 54px rgba(255,255,255,0.28)"
                : [
                    "0 14px 28px rgba(15,23,42,0.10)",
                    "0 26px 44px rgba(255,255,255,0.24)",
                    "0 18px 34px rgba(15,23,42,0.14)",
                    "0 28px 46px rgba(255,255,255,0.2)",
                    "0 14px 28px rgba(15,23,42,0.10)",
                  ],
            }}
            transition={{
              left: isSelected
                ? { duration: 0.16, ease: "easeOut" }
                : { type: "spring", stiffness: 160, damping: 18, mass: 0.75 },
              top: isSelected
                ? { duration: 0.16, ease: "easeOut" }
                : { type: "spring", stiffness: 160, damping: 18, mass: 0.75 },
              scale: isSelected
                ? { duration: 0.16, ease: "easeOut" }
                : { type: "spring", stiffness: 160, damping: 18, mass: 0.75 },
              filter: isSelected
                ? { duration: 0.16, ease: "easeOut" }
                : { duration: base.duration * 0.9, delay: base.delay * 0.76, repeat: Infinity, ease: "easeInOut" },
              boxShadow: isSelected
                ? { duration: 0.16, ease: "easeOut" }
                : { duration: base.duration * 0.82, delay: base.delay * 0.7, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <motion.div
              className="flex items-start gap-1.5"
              animate={isSelected ? { x: 0, y: 0, rotate: 0, scale: 1 } : {
                x: [0, base.floatX * 0.9, -base.floatX * 0.55, base.floatX, 0],
                y: [0, -base.floatY, base.floatY * 0.6, -base.floatY * 1.1, 0],
                rotate: [0, 2.1, -1.5, 1.1, 0],
                scale: [1, 1.018, 0.992, 1.012, 1],
              }}
              transition={{
                duration: base.duration,
                delay: base.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span
                className={cn(
                  "mt-0.5 block shrink-0 rounded-full",
                  tag.kind === "style" ? "h-2 w-2" : "h-1.5 w-1.5",
                  isSelected ? "bg-slate-900/70" : "bg-white/75",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="whitespace-normal break-words leading-[1.08]">{tag.label}</div>
                <div className="mt-0.5 text-[7px] font-bold uppercase leading-none tracking-[0.16em] text-slate-700/60">
                  {tag.kind === "style" ? "style" : tag.kind === "custom" ? "custom" : tag.category}
                </div>
              </div>
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
}
