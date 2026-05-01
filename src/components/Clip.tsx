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
 * to the playhead — the split-preview line is rendered by SplitPreviewOverlay
 * so this component can stay still during 60 fps playback updates.
 */
export const Clip = memo(function Clip({ clip, track, pxPerSec, selected }: Props) {
  const tool = useStore((s) => s.tool);
  const waveStyle = useStore((s) => s.tweaks.waveStyle);
  const selectClip = useStore((s) => s.selectClip);
  const moveClipTo = useStore((s) => s.moveClipTo);
  const setPlaying = useStore((s) => s.setPlaying);

  const left = clip.start * pxPerSec;
  const width = Math.max(2, clip.duration * pxPerSec);

  const visiblePeaks = useMemo(
    () => slicePeaks(track.peaks, track.peaksPerSec, clip.offset, clip.duration),
    [track.peaks, track.peaksPerSec, clip.offset, clip.duration],
  );

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool === "cut") {
      selectClip(clip.id, "replace");
      return;
    }
    if (e.shiftKey) selectClip(clip.id, "add");
    else if (e.metaKey || e.ctrlKey) selectClip(clip.id, "toggle");
    else selectClip(clip.id, "replace");
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (tool !== "move" || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setPlaying(false);
    if (!selected) selectClip(clip.id, "replace");
    const startX = e.clientX;
    const origStart = clip.start;
    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      moveClipTo(clip.id, snap(origStart + dx / pxPerSec));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
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
          cursor: tool === "move" ? "grab" : tool === "cut" ? "crosshair" : "default",
        } as React.CSSProperties
      }
      onClick={onClick}
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
