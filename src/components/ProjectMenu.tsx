import { useEffect, useRef, useState } from "react";
import { useStore } from "../state/store";
import {
  deleteProjectAndAudio,
  loadProject,
  newProject,
} from "../storage/persist";
import { listProjects, type ProjectListEntry } from "../storage/db";
import { projectLength } from "../state/store";
import { Icon } from "./Icon";

export function ProjectMenu() {
  const sessionName = useStore((s) => s.sessionName);
  const tracks = useStore((s) => s.tracks);
  const currentProjectId = useStore((s) => s.currentProjectId);
  const status = useStore((s) => s.status);

  const [open, setOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(sessionName);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const onNew = () => {
    setOpen(false);
    newProject();
  };

  const onOpenList = () => {
    setOpen(false);
    setOpenModal(true);
  };

  const onRenameStart = () => {
    setOpen(false);
    setRenameValue(sessionName);
    setRenaming(true);
  };

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== sessionName) {
      useStore.setState({ sessionName: trimmed });
    }
    setRenaming(false);
  };

  const onDelete = async () => {
    setOpen(false);
    if (!currentProjectId) return;
    if (!confirm(`Delete "${sessionName}"? This action cannot be undone.`)) return;
    await deleteProjectAndAudio(currentProjectId);
    newProject();
  };

  const totalSec = projectLength(tracks);
  const trackCount = tracks.length;

  const isSaving = status === "Saving…";

  return (
    <>
      <div className="project-menu" ref={wrapRef}>
        {renaming ? (
          <input
            className="project-name-input"
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              else if (e.key === "Escape") setRenaming(false);
            }}
          />
        ) : (
          <button
            className="project-name-btn"
            onClick={() => setOpen((v) => !v)}
            title="Project menu"
          >
            <strong>{sessionName}</strong>
            <Icon name="chevron-down" size={12} />
          </button>
        )}
        <span className="project-meta-sep">
          <span className="dot" />
          <span>{trackCount} tracks</span>
          <span className="dot" />
          <span>{formatDuration(totalSec)}</span>
          {isSaving && <span className="save-indicator">Saving…</span>}
        </span>

        {open && (
          <div className="project-dropdown">
            <button onClick={onNew}>
              <Icon name="plus" size={13} />
              New project
            </button>
            <button onClick={onOpenList}>
              <Icon name="folder" size={13} />
              Open project…
            </button>
            <button onClick={onRenameStart}>
              <Icon name="pencil" size={13} />
              Rename
            </button>
            <div className="project-dropdown-divider" />
            <button
              className="danger"
              onClick={onDelete}
              disabled={!currentProjectId}
              style={
                !currentProjectId
                  ? { opacity: 0.4, cursor: "not-allowed" }
                  : undefined
              }
            >
              <Icon name="trash" size={13} />
              Delete project
            </button>
          </div>
        )}
      </div>

      {openModal && <OpenProjectModal onClose={() => setOpenModal(false)} />}
    </>
  );
}

function OpenProjectModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<ProjectListEntry[] | null>(null);
  const currentProjectId = useStore((s) => s.currentProjectId);

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelect = async (id: string) => {
    onClose();
    try {
      await loadProject(id);
    } catch (err) {
      console.error(err);
      alert("Failed to load the project.");
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    await deleteProjectAndAudio(id);
    setItems((prev) => prev?.filter((p) => p.id !== id) ?? null);
    if (id === useStore.getState().currentProjectId) {
      newProject();
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>Open project</strong>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          {items == null ? (
            <div className="modal-empty">Loading…</div>
          ) : items.length === 0 ? (
            <div className="modal-empty">No saved projects yet</div>
          ) : (
            <ul className="project-list">
              {items.map((p) => (
                <li
                  key={p.id}
                  className={p.id === currentProjectId ? "is-current" : ""}
                >
                  <button
                    className="project-list-item"
                    onClick={() => onSelect(p.id)}
                  >
                    <span className="pli-name">{p.name}</span>
                    <span className="pli-meta">
                      {p.trackCount} tracks · {formatRelative(p.updatedAt)}
                    </span>
                  </button>
                  <button
                    className="icon-btn pli-delete"
                    onClick={() => onDelete(p.id, p.name)}
                    title="Delete"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDuration(s: number): string {
  if (s <= 0) return "0s";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  if (m === 0) return `${sec}s`;
  return `${m}m ${sec.toString().padStart(2, "0")}s`;
}

function formatRelative(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  const diffSec = (now - ts) / 1000;
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (diffSec < 86400 * 7) {
    const dd = Math.floor(diffSec / 86400);
    return `${dd} day${dd === 1 ? "" : "s"} ago`;
  }
  return d.toLocaleDateString();
}
