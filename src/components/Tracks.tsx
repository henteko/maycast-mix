import { memo, useRef, useState } from "react";
import { useStore } from "../state/store";
import { Clip } from "./Clip";
import { Icon } from "./Icon";
import { Ruler } from "./Ruler";
import { TrackHeader } from "./TrackHeader";
import type { Track } from "../types";

interface Props {
  onSeek: (t: number) => void;
  pxPerSec: number;
  projectLength: number;
}

const HEADER_W = 232;
const RULER_H = 28;
const ADD_TRACK_H = 56;
/** Headroom in seconds added past the last clip so users have room to drag. */
const TIMELINE_HEADROOM_SEC = 20;

export function Tracks({ onSeek, pxPerSec, projectLength }: Props) {
  const tracks = useStore((s) => s.tracks);
  const selection = useStore((s) => s.selection);
  const loadingFiles = useStore((s) => s.loadingFiles);
  const showPlayhead = useStore((s) => s.tweaks.showPlayhead);
  const showSelection = useStore((s) => s.tweaks.showSelection);
  const addFiles = useStore((s) => s.addFiles);
  const clearSelection = useStore((s) => s.clearSelection);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dropping, setDropping] = useState(false);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropping(true);
  };
  const onDragLeave = () => setDropping(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropping(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("audio") || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(f.name),
    );
    if (files.length) void addFiles(files);
  };
  const onPick = () => fileRef.current?.click();
  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) void addFiles(files);
    e.target.value = "";
  };

  const empty = tracks.length === 0 && loadingFiles.length === 0;
  const timelineSec = Math.max(60, projectLength + TIMELINE_HEADROOM_SEC);
  const laneWidth = timelineSec * pxPerSec;
  const trackHeight = useStore((s) => s.tweaks.trackHeight);
  const rowCount = tracks.length + loadingFiles.length;
  // Confine overlays to the actual rows so the playhead stops at the bottom of
  // the last track instead of running to the bottom of the flex-stretched box.
  const contentHeight = RULER_H + rowCount * trackHeight + ADD_TRACK_H;

  return (
    <div className="tracks-wrap" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <div
        className="tracks"
        onClick={(e) => {
          const cls = (e.target as HTMLElement).classList;
          if ((cls.contains("track-lane") || cls.contains("tracks")) && showSelection) {
            clearSelection();
          }
        }}
      >
        <Ruler
          projectLength={projectLength}
          pxPerSec={pxPerSec}
          laneWidth={laneWidth}
          onSeek={onSeek}
        />

        {tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            pxPerSec={pxPerSec}
            laneWidth={laneWidth}
            selection={selection}
          />
        ))}

        {loadingFiles.map((lf) => (
          <LoadingTrackRow key={lf.id} name={lf.name} laneWidth={laneWidth} />
        ))}

        <div className="add-track">
          <div className="add-track-header">
            <button className="add-track-btn" onClick={onPick}>
              <Icon name="plus" size={13} />
              音声を追加
            </button>
          </div>
          <div className="add-track-lane" style={{ width: laneWidth }}>
            <div className="add-track-hint">
              ファイルをドラッグ&ドロップ または
              <kbd>⌘</kbd>
              <kbd>O</kbd>
              で開く ・ MP3 / WAV / M4A 対応
            </div>
          </div>
        </div>

        {showPlayhead && tracks.length > 0 && (
          <PlayheadOverlay
            pxPerSec={pxPerSec}
            laneWidth={laneWidth}
            contentHeight={contentHeight}
          />
        )}
        <SplitPreviewOverlay
          pxPerSec={pxPerSec}
          trackCount={tracks.length}
          laneWidth={laneWidth}
          contentHeight={contentHeight}
        />
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
        style={{ display: "none" }}
        onChange={onFiles}
      />

      {empty && (
        <div className="empty-hint">
          <div className="empty-hint-card">
            <strong>音声ファイルを追加してミックスを始めましょう</strong>
            <div>
              「音声を追加」ボタン、もしくはここにファイルをドラッグ&ドロップ
            </div>
          </div>
        </div>
      )}

      {dropping && (
        <div className="drop-hint is-visible">
          <div className="drop-hint-card">音声ファイルをドロップ</div>
        </div>
      )}
    </div>
  );
}

function LoadingTrackRow({ name, laneWidth }: { name: string; laneWidth: number }) {
  return (
    <div className="track is-loading" aria-busy="true">
      <div className="track-header">
        <div className="th-row1">
          <div className="track-color loading-chip" />
          <div className="track-name muted" title={name}>
            {name}
          </div>
        </div>
        <div className="track-meta">
          <span className="spinner" />
          <span style={{ marginLeft: 6 }}>読み込み中…</span>
        </div>
      </div>
      <div className="track-lane" style={{ width: laneWidth }}>
        <div className="loading-shimmer" />
      </div>
    </div>
  );
}

const TrackRow = memo(function TrackRow({
  track,
  pxPerSec,
  laneWidth,
  selection,
}: {
  track: Track;
  pxPerSec: number;
  laneWidth: number;
  selection: Set<string>;
}) {
  const isSelected = track.clips.some((c) => selection.has(c.id));
  return (
    <div className="track">
      <TrackHeader track={track} selected={isSelected} />
      <div
        className={`track-lane ${isSelected ? "is-selected" : ""}`}
        style={{ width: laneWidth }}
      >
        {track.clips.map((c) => (
          <Clip
            key={c.id}
            clip={c}
            track={track}
            pxPerSec={pxPerSec}
            selected={selection.has(c.id)}
          />
        ))}
      </div>
    </div>
  );
});

function PlayheadOverlay({
  pxPerSec,
  laneWidth,
  contentHeight,
}: {
  pxPerSec: number;
  laneWidth: number;
  contentHeight: number;
}) {
  const playhead = useStore((s) => s.playhead);
  const tool = useStore((s) => s.tool);
  const phLeft = HEADER_W + playhead * pxPerSec;
  const totalWidth = HEADER_W + laneWidth;
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: contentHeight,
          width: totalWidth,
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <div
          className={`playhead ${tool === "cut" ? "is-cut" : ""}`}
          style={{
            left: phLeft,
            top: RULER_H - 6,
            height: contentHeight - (RULER_H - 6) - ADD_TRACK_H,
          }}
        />
      </div>
      <div
        className="playhead-tc-layer"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: totalWidth,
          height: RULER_H,
          pointerEvents: "none",
          zIndex: 25,
        }}
      >
        <div
          className="playhead-tc"
          style={{ left: phLeft + 8, top: 4, position: "absolute" }}
        >
          {formatPlayheadTC(playhead)}
        </div>
      </div>
    </>
  );
}

function SplitPreviewOverlay({
  pxPerSec,
  trackCount,
  laneWidth,
  contentHeight,
}: {
  pxPerSec: number;
  trackCount: number;
  laneWidth: number;
  contentHeight: number;
}) {
  const tool = useStore((s) => s.tool);
  if (tool !== "cut" || trackCount === 0) return null;
  return (
    <SplitPreviewActive
      pxPerSec={pxPerSec}
      laneWidth={laneWidth}
      contentHeight={contentHeight}
    />
  );
}

function SplitPreviewActive({
  pxPerSec,
  laneWidth,
  contentHeight,
}: {
  pxPerSec: number;
  laneWidth: number;
  contentHeight: number;
}) {
  const playhead = useStore((s) => s.playhead);
  const tracks = useStore((s) => s.tracks);
  const selection = useStore((s) => s.selection);
  const trackHeight = useStore((s) => s.tweaks.trackHeight);

  const items: { x: number; y: number; h: number }[] = [];
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    for (const clip of track.clips) {
      if (
        selection.has(clip.id) &&
        playhead > clip.start &&
        playhead < clip.start + clip.duration
      ) {
        items.push({
          x: HEADER_W + playhead * pxPerSec,
          y: RULER_H + i * trackHeight,
          h: trackHeight,
        });
      }
    }
  }
  if (items.length === 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        height: contentHeight,
        width: HEADER_W + laneWidth,
        pointerEvents: "none",
        zIndex: 7,
      }}
    >
      {items.map((it, i) => (
        <div
          key={i}
          className="clip-split-preview"
          style={{ left: it.x, top: it.y, height: it.h, width: 0, position: "absolute" }}
        >
          <div className="clip-split-line" />
          {i === 0 && (
            <div className="clip-split-badge">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <line x1="20" x2="8.12" y1="4" y2="15.88" />
                <line x1="14.47" x2="20" y1="14.48" y2="20" />
                <line x1="8.12" x2="12" y1="8.12" y2="12" />
              </svg>
              <span>分割</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatPlayheadTC(s: number): string {
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  const ms = Math.floor((s % 1) * 100).toString().padStart(2, "0");
  return `${mm}:${ss}.${ms}`;
}
