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
const TRACK_H = 96;
const ADD_TRACK_H = 56;
/** Headroom in seconds added past the last clip so users have room to drag. */
const TIMELINE_HEADROOM_SEC = 20;

export function Tracks({ onSeek, pxPerSec, projectLength }: Props) {
  const tracks = useStore((s) => s.tracks);
  const selection = useStore((s) => s.selection);
  const loadingFiles = useStore((s) => s.loadingFiles);
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
  const rowCount = tracks.length + loadingFiles.length;
  // Confine overlays to the actual rows so the playhead stops at the bottom of
  // the last track instead of running to the bottom of the flex-stretched box.
  const contentHeight = RULER_H + rowCount * TRACK_H + ADD_TRACK_H;

  return (
    <div className="tracks-wrap" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <div
        className="tracks"
        onClick={(e) => {
          const cls = (e.target as HTMLElement).classList;
          if (cls.contains("track-lane") || cls.contains("tracks")) {
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

        {tracks.length > 0 && (
          <PlayheadOverlay
            pxPerSec={pxPerSec}
            laneWidth={laneWidth}
            contentHeight={contentHeight}
          />
        )}
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
          className="playhead"
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


function formatPlayheadTC(s: number): string {
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  const ms = Math.floor((s % 1) * 100).toString().padStart(2, "0");
  return `${mm}:${ss}.${ms}`;
}
