"use client";

import * as React from "react";
import { useTracks } from "@/strudel/context/track-context";
import { TrackCard } from "./track-card";
import { AddTrackDialog } from "./add-track-dialog";
import { Plus } from "lucide-react";

export function DawPanel() {
  const { dawState } = useTracks();
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const anySoloed = dawState.tracks.some((t) => t.soloed);

  return (
    <div
      className="relative flex-1 flex flex-col min-h-0"
      style={{ background: "#ecffe4" }}
    >
      {/* Project header */}
      <div className="px-6 pt-5 pb-3 shrink-0">
        <h1
          className="text-3xl font-black tracking-tighter text-[#5c5f60]"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          {dawState.tracks.length > 0
            ? `${dawState.tracks.length} Track${dawState.tracks.length !== 1 ? "s" : ""}`
            : "Project"}
        </h1>
        <p
          className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
          style={{ color: "#5c5f60", opacity: 0.45 }}
        >
          {dawState.preamble.trim()
            ? dawState.preamble.trim()
            : "Ask the AI to generate music"}
        </p>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-3">
        {dawState.isMultiTrack && dawState.tracks.length > 0 ? (
          dawState.tracks.map((track) => (
            <TrackCard key={track.id} track={track} anySoloed={anySoloed} />
          ))
        ) : !dawState.isMultiTrack && dawState.rawCode.trim() ? (
          <SingleTrackFallback code={dawState.rawCode} />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Add Track FAB — always visible */}
      <div className="absolute bottom-6 left-6 z-10">
        <button
          onClick={() => setShowAddDialog(true)}
          className="group w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: "#ffe087",
            boxShadow: "0 4px 20px rgba(115,92,0,0.25)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px #ffe087, 0 4px 20px rgba(115,92,0,0.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(115,92,0,0.25)";
          }}
          aria-label="Add track"
        >
          <Plus className="w-6 h-6" style={{ color: "#241a00" }} />
          <span
            className="absolute left-full ml-3 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              background: "white",
              color: "#5c5f60",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            Add Track
          </span>
        </button>
      </div>

      {showAddDialog && (
        <AddTrackDialog onClose={() => setShowAddDialog(false)} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ background: "#d6e8ce" }}
      >
        <span className="text-2xl">🎛</span>
      </div>
      <p
        className="text-sm font-black uppercase tracking-widest"
        style={{ color: "#5c5f60", opacity: 0.5, fontFamily: "Manrope, sans-serif" }}
      >
        No Tracks Yet
      </p>
      <p className="text-xs mt-2 max-w-xs" style={{ color: "#5c5f60", opacity: 0.4 }}>
        Ask the AI to create music, or use Add Track to start manually.
      </p>
    </div>
  );
}

function SingleTrackFallback({ code }: { code: string }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#e7f9de" }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-3"
        style={{ color: "#5c5f60", opacity: 0.5, fontFamily: "Manrope, sans-serif" }}
      >
        Main Pattern
      </p>
      <pre
        className="text-xs font-mono leading-relaxed break-words whitespace-pre-wrap"
        style={{ color: "#444841cc" }}
      >
        {code.trim()}
      </pre>
    </div>
  );
}
