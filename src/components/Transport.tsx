import { Icon } from "./Icon";
import { projectLength, useStore } from "../state/store";

interface Props {
  onPlayPause: () => void;
  onSeek: (t: number) => void;
}

export function Transport({ onPlayPause, onSeek }: Props) {
  const tool = useStore((s) => s.tool);
  const setTool = useStore((s) => s.setTool);
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const playing = useStore((s) => s.playing);
  const playhead = useStore((s) => s.playhead);
  const tracks = useStore((s) => s.tracks);
  const selection = useStore((s) => s.selection);
  const splitAtPlayhead = useStore((s) => s.splitAtPlayhead);
  const duplicateSelection = useStore((s) => s.duplicateSelection);
  const deleteSelection = useStore((s) => s.deleteSelection);

  const total = projectLength(tracks);
  const cur = formatTC(playhead);
  const tot = formatTC(total);

  // Count "selected tracks" = tracks that have at least one selected clip.
  const selectedTracks = tracks.filter((t) =>
    t.clips.some((c) => selection.has(c.id)),
  );
  const selectedTrackCount = selectedTracks.length;
  const selectedClipCount = selection.size;

  return (
    <div className="transport">
      <div className="transport-group">
        <button className="tg-btn" title="先頭へ" onClick={() => onSeek(0)}>
          <Icon name="skip-back" size={14} />
        </button>
        <button className="tg-btn play" title="再生" onClick={onPlayPause}>
          <Icon name={playing ? "pause" : "play"} size={15} />
        </button>
        <button className="tg-btn" title="末尾へ" onClick={() => onSeek(total)}>
          <Icon name="skip-fwd" size={14} />
        </button>
        <button className="tg-btn" title="ループ">
          <Icon name="loop" size={14} />
        </button>
      </div>

      <div className="timecode">
        <span>
          {cur.mm}:{cur.ss}
        </span>
        <span className="ms">.{cur.ms}</span>
        <span className="total">
          / {tot.mm}:{tot.ss}
        </span>
      </div>

      <div className="tool-group" role="toolbar">
        <button
          className={`tool ${tool === "select" ? "is-active" : ""}`}
          title="選択・移動 (V / M)"
          onClick={() => setTool("select")}
        >
          <Icon name="select" size={14} />
        </button>
        <button
          className={`tool ${tool === "hand" ? "is-active" : ""}`}
          title="パン (H)"
          onClick={() => setTool("hand")}
        >
          <Icon name="hand" size={14} />
        </button>
      </div>

      <div className="zoom">
        <span className="zoom-label">Zoom</span>
        <button
          className="icon-btn"
          style={{ width: 24, height: 24 }}
          onClick={() => setZoom(zoom - 0.2)}
        >
          <Icon name="zoom-out" size={13} />
        </button>
        <div className="zoom-track">
          <div
            className="zoom-fill"
            style={{ width: `${(zoom / 3) * 100}%` }}
          />
          <div
            className="zoom-thumb"
            style={{ left: `${(zoom / 3) * 100}%` }}
          />
        </div>
        <button
          className="icon-btn"
          style={{ width: 24, height: 24 }}
          onClick={() => setZoom(zoom + 0.2)}
        >
          <Icon name="zoom-in" size={13} />
        </button>
        <span
          style={{
            fontSize: 11,
            color: "var(--fg-subtle)",
            fontFamily: "var(--font-mono)",
            minWidth: 32,
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
      </div>

      <div className="transport-spacer" />

      {selectedClipCount > 0 && (
        <div className="selection-summary">
          <span className="sel-count">
            {selectedTrackCount} トラック・{selectedClipCount} クリップ選択中
          </span>
          <span className="sel-time">@ {cur.mm}:{cur.ss}.{cur.ms}</span>
          <div className="sel-actions">
            <button
              className="sel-action"
              title="再生位置で分割 (⌘B)"
              onClick={() => splitAtPlayhead()}
            >
              <Icon name="scissors" size={13} />
            </button>
            <button
              className="sel-action"
              title="複製"
              onClick={() => duplicateSelection()}
            >
              <Icon name="duplicate" size={13} />
            </button>
            <button
              className="sel-action"
              title="削除"
              onClick={() => deleteSelection()}
            >
              <Icon name="trash" size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTC(s: number) {
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  const ms = Math.floor((s % 1) * 1000)
    .toString()
    .padStart(3, "0");
  return { mm, ss, ms };
}
