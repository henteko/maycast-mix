import { create } from "zustand";
import type { Clip, LoadingFile, ProjectLoadingState, Tool, Track } from "../types";
import { decodeFile } from "../audio/decoder";
import { computePeaks } from "../audio/peaks";
import { putAudio } from "../storage/db";
import { paletteForIndex } from "./palettes";

const PEAKS_PER_SEC = 20;

let _id = 0;
const uid = (prefix: string) => `${prefix}_${++_id}_${Date.now().toString(36)}`;

/** Snapshot of the editable, undoable slice of the store. */
interface HistorySnapshot {
  tracks: Track[];
  selection: Set<string>;
}

const MAX_HISTORY = 50;

interface State {
  /** Project id in IndexedDB. null = unsaved (no record yet). */
  currentProjectId: string | null;
  sessionName: string;
  tracks: Track[];
  /** Set of selected clip ids */
  selection: Set<string>;
  playhead: number;
  zoom: number;
  tool: Tool;
  playing: boolean;
  /** Files currently being decoded — rendered as ghost rows in the timeline. */
  loadingFiles: LoadingFile[];
  /** Set while loading a saved project; drives the fullscreen overlay. */
  projectLoading: ProjectLoadingState | null;
  /** Last error/info message to surface in the status bar */
  status: string;
  exporting: boolean;
  /** 0..1 while exporting, null otherwise. */
  exportProgress: number | null;
  /** Edit history. `past` is for undo, `future` is for redo. */
  past: HistorySnapshot[];
  future: HistorySnapshot[];
}

interface Actions {
  // Files
  addFiles: (files: File[]) => Promise<void>;

  // Selection
  selectClip: (id: string, mode: "replace" | "add" | "toggle") => void;
  selectTrack: (trackId: string, mode: "replace" | "add") => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Editing
  splitAtPlayhead: () => void;
  /**
   * Atomically set new start positions for a batch of clips. Used during
   * drag so that multi-selected clips all advance by the same delta on every
   * mousemove.
   */
  setClipStarts: (updates: Array<{ id: string; start: number }>) => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;

  // Tracks
  setTrackVolume: (trackId: string, v: number) => void;
  toggleMute: (trackId: string) => void;
  toggleSolo: (trackId: string) => void;
  removeTrack: (trackId: string) => void;

  // Transport
  setPlayhead: (t: number) => void;
  setZoom: (z: number) => void;
  setTool: (t: Tool) => void;
  setPlaying: (b: boolean) => void;

  // Status
  setStatus: (s: string) => void;
  setExporting: (b: boolean) => void;
  setExportProgress: (p: number | null) => void;

  // History
  /**
   * Snapshot the current undoable slice (tracks + selection) and clear the
   * redo stack. Call BEFORE the first edit in a logical user action — drag
   * handlers call this on drag start, single-shot edits push internally.
   */
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export type Store = State & Actions;

export const useStore = create<Store>((set, get) => ({
  currentProjectId: null,
  sessionName: "untitled_session",
  tracks: [],
  selection: new Set(),
  playhead: 0,
  zoom: 1.4,
  tool: "select",
  playing: false,
  loadingFiles: [],
  projectLoading: null,
  status: "Ready",
  exporting: false,
  exportProgress: null,
  past: [],
  future: [],

  async addFiles(files) {
    if (!files.length) return;
    // Snapshot the existing track count so palette assignment is deterministic
    // even though decodes finish out of order.
    const baseIndex = get().tracks.length;
    const loaders: LoadingFile[] = files.map((f) => ({
      id: uid("l"),
      name: f.name,
    }));
    set((s) => ({
      loadingFiles: [...s.loadingFiles, ...loaders],
      status: `Loading ${files[0].name}${files.length > 1 ? ` (+${files.length - 1} more)` : "…"}`,
      // Snapshot the pre-import state so a single ⌘Z removes the whole batch.
      past: pushSnap(s.past, snap(s)),
      future: [],
    }));

    const loadOne = async (file: File, loaderId: string, paletteIdx: number) => {
      try {
        const buffer = await decodeFile(file);
        const peaks = computePeaks(buffer, PEAKS_PER_SEC);
        const trackId = uid("t");
        const audioId = uid("a");
        const palette = paletteForIndex(paletteIdx);
        const channels = buffer.numberOfChannels;
        const meta = `${(buffer.sampleRate / 1000).toFixed(1)} kHz · ${
          channels === 1 ? "Mono" : channels === 2 ? "Stereo" : `${channels}ch`
        }`;
        // Persist the encoded source + peaks to IndexedDB right away so the
        // audio survives a reload even before the user (or auto-save) writes
        // a project record referencing this audioId.
        await putAudio(audioId, {
          blob: file,
          peaks,
          peaksPerSec: PEAKS_PER_SEC,
          sampleRate: buffer.sampleRate,
          channels,
          filename: file.name,
        });
        const clip: Clip = {
          id: uid("c"),
          trackId,
          name: stripExt(file.name),
          start: 0,
          offset: 0,
          duration: buffer.duration,
        };
        const track: Track = {
          id: trackId,
          name: file.name,
          audioId,
          buffer,
          peaks,
          peaksPerSec: PEAKS_PER_SEC,
          sampleRate: buffer.sampleRate,
          channels,
          meta,
          palette,
          volume: 0.85,
          mute: false,
          solo: false,
          clips: [clip],
        };
        set((s) => ({
          tracks: [...s.tracks, track],
          loadingFiles: s.loadingFiles.filter((l) => l.id !== loaderId),
        }));
      } catch (err) {
        console.error("decode failed", file.name, err);
        set((s) => ({
          loadingFiles: s.loadingFiles.filter((l) => l.id !== loaderId),
          status: `Failed to load ${file.name}`,
        }));
      }
    };

    await Promise.all(
      files.map((file, i) => loadOne(file, loaders[i].id, baseIndex + i)),
    );

    set((s) => ({
      status:
        s.loadingFiles.length === 0
          ? "Ready"
          : `Loading ${s.loadingFiles.length} more…`,
    }));
  },

  selectClip(id, mode) {
    set((s) => {
      const next = new Set(s.selection);
      if (mode === "replace") {
        next.clear();
        next.add(id);
      } else if (mode === "add") {
        next.add(id);
      } else {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      return { selection: next };
    });
  },

  selectTrack(trackId, mode) {
    set((s) => {
      const track = s.tracks.find((t) => t.id === trackId);
      if (!track) return {};
      const next = mode === "replace" ? new Set<string>() : new Set(s.selection);
      for (const c of track.clips) next.add(c.id);
      return { selection: next };
    });
  },

  selectAll() {
    set((s) => {
      const next = new Set<string>();
      for (const t of s.tracks) for (const c of t.clips) next.add(c.id);
      return { selection: next };
    });
  },

  clearSelection() {
    set({ selection: new Set() });
  },

  splitAtPlayhead() {
    const { tracks, selection, playhead } = get();
    let didSplit = false;
    const newSelection = new Set<string>();
    const updatedTracks = tracks.map((track) => {
      const trackHasSelection = track.clips.some((c) => selection.has(c.id));
      if (!trackHasSelection) return track;

      let trackChanged = false;
      const newClips: Clip[] = [];
      for (const clip of track.clips) {
        const end = clip.start + clip.duration;
        if (
          selection.has(clip.id) &&
          playhead > clip.start + 0.005 &&
          playhead < end - 0.005
        ) {
          const headDur = playhead - clip.start;
          const tailDur = end - playhead;
          const head: Clip = {
            ...clip,
            duration: headDur,
          };
          const tail: Clip = {
            id: uid("c"),
            trackId: clip.trackId,
            name: clip.name,
            start: playhead,
            offset: clip.offset + headDur,
            duration: tailDur,
          };
          newClips.push(head, tail);
          newSelection.add(head.id);
          newSelection.add(tail.id);
          trackChanged = true;
          didSplit = true;
        } else {
          newClips.push(clip);
          if (selection.has(clip.id)) newSelection.add(clip.id);
        }
      }
      return trackChanged ? { ...track, clips: newClips } : track;
    });
    if (didSplit) {
      // Carry forward the original selection for tracks that were not touched.
      for (const t of tracks) {
        for (const c of t.clips) if (selection.has(c.id) && !newSelection.has(c.id)) newSelection.add(c.id);
      }
      set((s) => ({
        tracks: updatedTracks,
        selection: newSelection,
        past: pushSnap(s.past, snap(s)),
        future: [],
      }));
    }
  },

  setClipStarts(updates) {
    if (updates.length === 0) return;
    const map = new Map(updates.map((u) => [u.id, Math.max(0, u.start)]));
    set((s) => {
      const tracks = s.tracks.map((track) => {
        // Skip the entire track if it has no clips being updated.
        if (!track.clips.some((c) => map.has(c.id))) return track;
        let changed = false;
        const newClips = track.clips.map((c) => {
          const next = map.get(c.id);
          if (next != null && next !== c.start) {
            changed = true;
            return { ...c, start: next };
          }
          return c;
        });
        return changed ? { ...track, clips: newClips } : track;
      });
      return { tracks };
    });
  },

  deleteSelection() {
    set((s) => {
      if (s.selection.size === 0) return {};
      const tracks = s.tracks.map((track) => {
        if (!track.clips.some((c) => s.selection.has(c.id))) return track;
        return { ...track, clips: track.clips.filter((c) => !s.selection.has(c.id)) };
      });
      return {
        tracks,
        selection: new Set<string>(),
        past: pushSnap(s.past, snap(s)),
        future: [],
      };
    });
  },

  duplicateSelection() {
    set((s) => {
      if (s.selection.size === 0) return {};
      const newSelection = new Set<string>();
      const tracks = s.tracks.map((track) => {
        const selectedHere = track.clips.filter((c) => s.selection.has(c.id));
        if (selectedHere.length === 0) return track;
        const additions: Clip[] = selectedHere.map((c) => {
          const dup: Clip = { ...c, id: uid("c"), start: c.start + c.duration };
          newSelection.add(dup.id);
          return dup;
        });
        return { ...track, clips: [...track.clips, ...additions] };
      });
      return {
        tracks,
        selection: newSelection,
        past: pushSnap(s.past, snap(s)),
        future: [],
      };
    });
  },

  setTrackVolume(trackId, v) {
    // No history push: callers (slider drag) call pushHistory() once at the
    // start of a drag so the whole drag becomes a single undo step.
    const vv = Math.max(0, Math.min(1, v));
    set((s) => ({ tracks: updateTrack(s.tracks, trackId, (t) => ({ ...t, volume: vv })) }));
  },

  toggleMute(trackId) {
    set((s) => ({
      tracks: updateTrack(s.tracks, trackId, (t) => ({ ...t, mute: !t.mute })),
      past: pushSnap(s.past, snap(s)),
      future: [],
    }));
  },

  toggleSolo(trackId) {
    set((s) => ({
      tracks: updateTrack(s.tracks, trackId, (t) => ({ ...t, solo: !t.solo })),
      past: pushSnap(s.past, snap(s)),
      future: [],
    }));
  },

  removeTrack(trackId) {
    set((s) => {
      const track = s.tracks.find((t) => t.id === trackId);
      if (!track) return {};
      // Drop any selected clip ids that lived on the removed track. The
      // encoded audio blob is intentionally NOT deleted from IndexedDB so
      // that ⌘Z can resurrect the track and a subsequent save can re-write
      // the project record referencing the same audioId.
      const removedClipIds = new Set(track.clips.map((c) => c.id));
      const nextSelection = new Set<string>();
      for (const id of s.selection) if (!removedClipIds.has(id)) nextSelection.add(id);
      return {
        tracks: s.tracks.filter((t) => t.id !== trackId),
        selection: nextSelection,
        past: pushSnap(s.past, snap(s)),
        future: [],
      };
    });
  },

  setPlayhead(t) {
    set({ playhead: Math.max(0, t) });
  },

  setZoom(z) {
    set({ zoom: Math.max(0.4, Math.min(3, z)) });
  },

  setTool(t) {
    set({ tool: t });
  },

  setPlaying(b) {
    set({ playing: b });
  },

  setStatus(s) {
    set({ status: s });
  },

  setExporting(b) {
    set({ exporting: b });
  },

  setExportProgress(p) {
    set({ exportProgress: p });
  },

  pushHistory() {
    set((s) => ({ past: pushSnap(s.past, snap(s)), future: [] }));
  },

  undo() {
    set((s) => {
      if (s.past.length === 0) return {};
      const prev = s.past[s.past.length - 1];
      return {
        tracks: prev.tracks,
        selection: prev.selection,
        past: s.past.slice(0, -1),
        future: pushSnap(s.future, snap(s)),
      };
    });
  },

  redo() {
    set((s) => {
      if (s.future.length === 0) return {};
      const next = s.future[s.future.length - 1];
      return {
        tracks: next.tracks,
        selection: next.selection,
        past: pushSnap(s.past, snap(s)),
        future: s.future.slice(0, -1),
      };
    });
  },
}));

/** Take a snapshot of the undoable slice of the current state. */
function snap(s: { tracks: Track[]; selection: Set<string> }): HistorySnapshot {
  return { tracks: s.tracks, selection: s.selection };
}

/** Push a snapshot onto a history stack, capped at MAX_HISTORY entries. */
function pushSnap(stack: HistorySnapshot[], item: HistorySnapshot): HistorySnapshot[] {
  if (stack.length >= MAX_HISTORY) {
    return [...stack.slice(stack.length - MAX_HISTORY + 1), item];
  }
  return [...stack, item];
}

// ─── Selectors ────────────────────────────────────────────────────────────

/** Linear-gain → dB string (e.g. "-6.0", or "-∞" near zero). */
export function gainToDb(v: number): string {
  if (v <= 0.001) return "-∞";
  return (20 * Math.log10(v)).toFixed(1);
}

/** Total project length = max clip end time across all tracks. */
export function projectLength(tracks: Track[]): number {
  let max = 0;
  for (const t of tracks)
    for (const c of t.clips) {
      const end = c.start + c.duration;
      if (end > max) max = end;
    }
  return max;
}

function stripExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

/**
 * Apply `f` to the single track with id === trackId, returning a new array
 * where every other track keeps its original reference. Stable refs let
 * React.memo short-circuit re-renders for unaffected rows.
 */
function updateTrack(
  tracks: Track[],
  trackId: string,
  f: (t: Track) => Track,
): Track[] {
  const idx = tracks.findIndex((t) => t.id === trackId);
  if (idx === -1) return tracks;
  const next = tracks.slice();
  next[idx] = f(tracks[idx]);
  return next;
}

