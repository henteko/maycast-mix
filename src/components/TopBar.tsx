import { useRef } from "react";
import { Icon } from "./Icon";
import { useStore } from "../state/store";
import { ProjectMenu } from "./ProjectMenu";

interface Props {
  onExport: () => void;
}

export function TopBar({ onExport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const tracks = useStore((s) => s.tracks);
  const exporting = useStore((s) => s.exporting);
  const exportProgress = useStore((s) => s.exportProgress);
  const addFiles = useStore((s) => s.addFiles);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);

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
          Maycast<em>Slice</em>
        </div>
      </div>
      <ProjectMenu />
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <button className="btn btn-ghost" onClick={onPick}>
          <Icon name="upload" size={14} />
          Add audio
        </button>
        <button
          className="icon-btn"
          title="Undo (⌘Z)"
          onClick={undo}
          disabled={!canUndo}
          style={!canUndo ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
        >
          <Icon name="undo" size={15} />
        </button>
        <button
          className="icon-btn"
          title="Redo (⌘⇧Z)"
          onClick={redo}
          disabled={!canRedo}
          style={!canRedo ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
        >
          <Icon name="redo" size={15} />
        </button>
        <button className="icon-btn" title="Help" onClick={showHelp}>
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
          {exporting
            ? exportProgress != null
              ? `Exporting ${Math.round(exportProgress * 100)}%`
              : "Exporting…"
            : "Export MP3"}
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

function showHelp() {
  alert(
    [
      "Maycast Slice — Keyboard shortcuts",
      "",
      "Space     Play / Pause",
      "V / M     Select / Move tool",
      "H         Pan tool",
      "⌘B        Split selected tracks at the playhead",
      "⌘O        Add audio file(s)",
      "⌘A        Select all clips",
      "Delete    Delete selected clips",
      "⌘Z / ⌘⇧Z  Undo / Redo",
      "Home/End  Jump to start / end",
      "⌘+/-      Zoom in / out",
    ].join("\n"),
  );
}
