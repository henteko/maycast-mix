import { useRef } from "react";
import { Icon } from "./Icon";
import { projectLength, useStore } from "../state/store";

interface Props {
  onExport: () => void;
  onToggleTweaks: () => void;
}

export function TopBar({ onExport, onToggleTweaks }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const sessionName = useStore((s) => s.sessionName);
  const tracks = useStore((s) => s.tracks);
  const exporting = useStore((s) => s.exporting);
  const addFiles = useStore((s) => s.addFiles);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const trackCount = tracks.length;
  const len = projectLength(tracks);

  const onPick = () => fileRef.current?.click();
  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) void addFiles(files);
    e.target.value = "";
  };

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <Icon name="logo" size={14} />
        </div>
        <div className="brand-name">
          Maycast<em>Mix</em>
        </div>
      </div>
      <div className="project-meta">
        <strong>{sessionName}</strong>
        <span className="dot" />
        <span>{trackCount} tracks</span>
        <span className="dot" />
        <span>{formatDuration(len)}</span>
      </div>
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <button className="btn btn-ghost" onClick={onPick}>
          <Icon name="upload" size={14} />
          音声を追加
        </button>
        <button
          className="icon-btn"
          title="元に戻す (⌘Z)"
          onClick={undo}
          disabled={!canUndo}
          style={!canUndo ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
        >
          <Icon name="undo" size={15} />
        </button>
        <button
          className="icon-btn"
          title="やり直し (⌘⇧Z)"
          onClick={redo}
          disabled={!canRedo}
          style={!canRedo ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
        >
          <Icon name="redo" size={15} />
        </button>
        <button className="icon-btn" title="Tweaks" onClick={onToggleTweaks}>
          <Icon name="sliders" size={15} />
        </button>
        <button className="icon-btn" title="ヘルプ" onClick={showHelp}>
          <Icon name="help" size={15} />
        </button>
        <div style={{ width: 8 }} />
        <button
          className="btn btn-primary"
          onClick={onExport}
          disabled={exporting || tracks.length === 0}
          style={
            exporting || tracks.length === 0
              ? { opacity: 0.6, cursor: "not-allowed" }
              : undefined
          }
        >
          <Icon name="download" size={14} />
          {exporting ? "書き出し中…" : "MP3で書き出し"}
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
          style={{ display: "none" }}
          onChange={onFiles}
        />
      </div>
    </div>
  );
}

function formatDuration(s: number): string {
  if (s <= 0) return "0 sec";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  if (m === 0) return `${sec} sec`;
  return `${m} min ${sec.toString().padStart(2, "0")} sec`;
}

function showHelp() {
  alert(
    [
      "Maycast Mix — キーボードショートカット",
      "",
      "Space     再生 / 一時停止",
      "V / M     選択・移動ツール",
      "H         パンツール",
      "⌘B        再生位置で選択トラックを分割",
      "⌘O        音声を追加",
      "⌘A        全選択",
      "Delete    選択中のクリップを削除",
      "⌘Z / ⌘⇧Z  元に戻す / やり直し",
      "Home/End  先頭 / 末尾",
      "⌘+/-      ズームイン / アウト",
    ].join("\n"),
  );
}
