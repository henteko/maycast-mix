import { memo } from "react";
import { gainToDb, useStore } from "../state/store";
import type { Track } from "../types";
import { Icon } from "./Icon";

interface Props {
  track: Track;
  selected: boolean;
}

export const TrackHeader = memo(function TrackHeader({ track, selected }: Props) {
  const setVolume = useStore((s) => s.setTrackVolume);
  const toggleMute = useStore((s) => s.toggleMute);
  const toggleSolo = useStore((s) => s.toggleSolo);
  const removeTrack = useStore((s) => s.removeTrack);
  const selectTrack = useStore((s) => s.selectTrack);
  const pushHistory = useStore((s) => s.pushHistory);

  const onVolMouseDown = (e: React.MouseEvent) => {
    // One undo step covers the whole slider drag.
    pushHistory();
    const el = e.currentTarget as HTMLDivElement;
    const update = (clientX: number) => {
      const r = el.getBoundingClientRect();
      const v = (clientX - r.left) / r.width;
      setVolume(track.id, Math.max(0, Math.min(1, v)));
    };
    update(e.clientX);
    const move = (ev: MouseEvent) => update(ev.clientX);
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <div
      className={`track-header ${selected ? "is-selected" : ""}`}
      onClick={(e) => {
        if (e.target instanceof HTMLButtonElement) return;
        selectTrack(track.id, e.shiftKey || e.metaKey ? "add" : "replace");
      }}
    >
      <div className="th-row1">
        <div className="track-color" style={{ background: track.palette.color }} />
        <div className="track-name" title={track.name}>
          {track.name}
        </div>
        <button
          className="th-remove"
          title="Remove track (⌘Z to undo)"
          aria-label={`Remove track ${track.name}`}
          onClick={(e) => {
            e.stopPropagation();
            removeTrack(track.id);
          }}
        >
          <Icon name="trash" size={12} />
        </button>
      </div>
      <div className="track-meta">{track.meta}</div>
      <div className="th-row2">
        <button
          className={`th-btn ${track.mute ? "is-on-m" : ""}`}
          title="Mute"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute(track.id);
          }}
        >
          M
        </button>
        <button
          className={`th-btn ${track.solo ? "is-on-s" : ""}`}
          title="Solo"
          onClick={(e) => {
            e.stopPropagation();
            toggleSolo(track.id);
          }}
        >
          S
        </button>
        <div className="th-vol" onMouseDown={onVolMouseDown}>
          <div
            className="th-vol-fill"
            style={{ width: `${track.volume * 100}%` }}
          />
          <div
            className="th-vol-thumb"
            style={{ left: `${track.volume * 100}%` }}
          />
        </div>
        <span className="th-db">{gainToDb(track.volume)}</span>
      </div>
    </div>
  );
});
