"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: number; // 0..1
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
};

export function VolumeFader({ value, onChange, disabled, className }: Props) {
  const dbLabel = React.useMemo(() => {
    if (value <= 0) return "-∞";
    const db = 20 * Math.log10(Math.max(0.001, value));
    return `${db > 0 ? "+" : ""}${db.toFixed(1)} dB`;
  }, [value]);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between items-baseline">
        <span
          className="text-[9px] font-bold uppercase tracking-widest"
          style={{ color: "#5c5f60", opacity: 0.5 }}
        >
          Volume
        </span>
        <span
          className="text-[9px] font-bold tabular-nums"
          style={{ color: "#5c5f60", opacity: 0.5 }}
        >
          {dbLabel}
        </span>
      </div>

      <div className="relative h-8 flex items-center">
        {/* Track groove */}
        <div
          className="absolute inset-x-0 h-1 rounded-full mx-3"
          style={{ background: "#c4c8bf" }}
        />
        {/* Fill */}
        <div
          className="absolute left-3 h-1 rounded-full pointer-events-none"
          style={{
            width: `calc(${value * 100}% * (1 - 6px / 100%))`,
            background: disabled ? "#9ea99b" : "#5c5f60",
            opacity: 0.4,
            maxWidth: "calc(100% - 1.5rem)",
          }}
        />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={cn(
            "daw-fader relative w-full h-8 appearance-none bg-transparent focus:outline-none",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          )}
        />
      </div>
    </div>
  );
}
