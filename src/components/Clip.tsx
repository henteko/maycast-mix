import { memo, useMemo } from "react";
import type { Clip as ClipT, Track } from "../types";
import { Waveform } from "./Waveform";
import { slicePeaks } from "../audio/peaks";
import { useStore } from "../state/store";

interface Props {
  clip: ClipT;
  track: Track;
  pxPerSec: number;
  selected: boolean;
}

/**
 * Renders one clip block (header + waveform). Intentionally does NOT subscribe
 * to the playhead so the component can stay still during 60 fps playback.
 */
export const Clip = memo(function Clip({ clip, track, pxPerSec, selected }: Props) {
  const tool = useStore((s) => s.tool);
  const waveStyle = useStore((s) => s.tweaks.waveStyle);
  const selectClip = useStore((s) => s.selectClip);
  const setClipStarts = useStore((s) => s.setClipStarts);
  const setPlaying = useStore((s) => s.setPlaying);

  const left = clip.start * pxPerSec;
  const width = Math.max(2, clip.duration * pxPerSec);

  const visiblePeaks = useMemo(
    () => slicePeaks(track.peaks, track.peaksPerSec, clip.offset, clip.duration),
    [track.peaks, track.peaksPerSec, clip.offset, clip.duration],
  );

  /**
   * Unified click + drag handler for the select tool.
   *
   * The challenge is that a multi-selection should survive a "click on one
   * of the already-selected clips and then drag" — but a plain click on
   * such a clip without dragging should collapse the selection back to
   * just that clip. So we defer the collapse until mouseup, and only do it
   * if the user didn't actually drag.
   */
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (tool === "hand") return; // pan tool is handled at the App level
    e.stopPropagation();
    e.preventDefault();
    setPlaying(false);

    const state = useStore.getState();
    const wasSelected = state.selection.has(clip.id);
    const isModified = e.shiftKey || e.metaKey || e.ctrlKey;

    // Apply the "additive" selection updates immediately so the user sees
    // the change. Plain-click collapse is deferred to mouseup.
    if (e.shiftKey) {
      selectClip(clip.id, "add");
    } else if (e.metaKey || e.ctrlKey) {
      selectClip(clip.id, "toggle");
    } else if (!wasSelected) {
      selectClip(clip.id, "replace");
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const DRAG_THRESHOLD = 3;
    let dragging = false;
    let origStarts: Map<string, number> | null = null;
    let minStart = Infinity;

    const beginDragIfNeeded = () => {
      if (dragging) return;
      dragging = true;
      // Snapshot the CURRENT selection (after the mousedown selection edits).
      const cur = useStore.getState();
      const sel = cur.selection;
      origStarts = new Map();
      for (const t of cur.tracks) {
        for (const c of t.clips) {
          if (sel.has(c.id)) origStarts.set(c.id, c.start);
        }
      }
      origStarts.forEach((s) => {
        if (s < minStart) minStart = s;
      });
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragging) {
        if (
          Math.abs(ev.clientX - startX) < DRAG_THRESHOLD &&
          Math.abs(ev.clientY - startY) < DRAG_THRESHOLD
        ) {
          return;
        }
        beginDragIfNeeded();
      }
      if (!origStarts) return;
      const rawDelta = (ev.clientX - startX) / pxPerSec;
      const snappedDelta = snap(rawDelta);
      // Bound the delta so the leftmost dragged clip never goes below 0;
      // per-clip clamping would skew the group's relative positions.
      const delta = Math.max(snappedDelta, -minStart);
      const updates: Array<{ id: string; start: number }> = [];
      origStarts.forEach((s0, id) => {
        updates.push({ id, start: s0 + delta });
      });
      setClipStarts(updates);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      // Plain click on an already-selected clip without drag → collapse the
      // selection to just this clip (Figma-style behavior).
      if (!dragging && !isModified && wasSelected) {
        selectClip(clip.id, "replace");
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      className={`clip ${selected ? "is-selected" : ""}`}
      style={
        {
          left,
          width,
          "--clip-bg": track.palette.clipBg,
          "--clip-border": track.palette.clipBorder,
          "--clip-head": track.palette.clipHead,
          "--clip-fg": track.palette.clipFg,
          cursor: "grab",
        } as React.CSSProperties
      }
      onMouseDown={onMouseDown}
    >
      <div className="clip-head">
        <span className="clip-name">{clip.name}</span>
        <span className="clip-len">{formatDur(clip.duration)}</span>
      </div>
      <div className="clip-wave">
        <Waveform peaks={visiblePeaks} color={track.palette.waveColor} style={waveStyle} />
      </div>
    </div>
  );
});

function snap(t: number): number {
  return Math.round(t * 20) / 20;
}

function formatDur(s: number): string {
  const mm = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}
