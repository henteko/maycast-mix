import type { Track } from "../types";
import { useStore } from "../state/store";
import { getAudioContext } from "../audio/decoder";
import {
  deleteAudio,
  deleteProject,
  getAudio,
  getProject,
  putProject,
  type PersistedTrack,
  type ProjectRecord,
} from "./db";

const LAST_PROJECT_KEY = "maycast-mix.lastProjectId";

let _id = 0;
function uid(prefix: string): string {
  return `${prefix}_${++_id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Snapshot the current store into a ProjectRecord and write it to IDB.
 * If no project id is set yet, generates one and stores it on the store.
 * Returns the resolved id.
 */
export async function saveCurrentProject(): Promise<string> {
  const s = useStore.getState();
  const id = s.currentProjectId ?? uid("p");
  const now = Date.now();
  const existing = s.currentProjectId ? await getProject(id) : undefined;

  const tracks: PersistedTrack[] = s.tracks.map((t) => ({
    id: t.id,
    name: t.name,
    audioId: t.audioId,
    meta: t.meta,
    palette: t.palette,
    volume: t.volume,
    mute: t.mute,
    solo: t.solo,
    clips: t.clips,
  }));

  const record: ProjectRecord = {
    id,
    name: s.sessionName,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    tracks,
    zoom: s.zoom,
    playhead: s.playhead,
  };

  await putProject(record);
  if (s.currentProjectId !== id) {
    useStore.setState({ currentProjectId: id });
  }
  localStorage.setItem(LAST_PROJECT_KEY, id);
  return id;
}

/**
 * Load the project with the given id from IDB, decode every track's audio,
 * and replace the store state with it. Throws if the project is missing.
 */
export async function loadProject(id: string): Promise<void> {
  const record = await getProject(id);
  if (!record) throw new Error(`Project not found: ${id}`);

  // Show the loading overlay; it'll be cleared when state is replaced below
  // (and on error in the catch path).
  useStore.setState({
    projectLoading: {
      name: record.name,
      current: 0,
      total: record.tracks.length,
    },
  });

  try {
    const ctx = getAudioContext();
    const tracks: Track[] = [];
    for (let i = 0; i < record.tracks.length; i++) {
      const pt = record.tracks[i];
      const audio = await getAudio(pt.audioId);
      if (audio) {
        try {
          // Some browsers reject the buffer once consumed — slice() to copy.
          const buffer = await ctx.decodeAudioData(
            await audio.blob.arrayBuffer(),
          );
          tracks.push({
            id: pt.id,
            name: pt.name,
            audioId: pt.audioId,
            buffer,
            peaks: audio.peaks,
            peaksPerSec: audio.peaksPerSec,
            sampleRate: audio.sampleRate,
            channels: audio.channels,
            meta: pt.meta,
            palette: pt.palette,
            volume: pt.volume,
            mute: pt.mute,
            solo: pt.solo,
            clips: pt.clips,
          });
        } catch (err) {
          console.error(`Failed to decode audio for track ${pt.id}`, err);
        }
      } else {
        console.warn(`Audio missing for track ${pt.id} (${pt.audioId})`);
      }
      // Bump progress regardless of success so the user sees the loop advance.
      useStore.setState((s) => ({
        projectLoading: s.projectLoading
          ? { ...s.projectLoading, current: i + 1 }
          : null,
      }));
    }
    useStore.setState({
      currentProjectId: record.id,
      sessionName: record.name,
      tracks,
      selection: new Set(),
      playhead: record.playhead ?? 0,
      zoom: record.zoom ?? 1.4,
      loadingFiles: [],
      past: [],
      future: [],
      status: "Ready",
      projectLoading: null,
    });
    localStorage.setItem(LAST_PROJECT_KEY, record.id);
  } catch (err) {
    useStore.setState({ projectLoading: null });
    throw err;
  }
}

/** Reset the store to an empty unsaved session. */
export function newProject(): void {
  useStore.setState({
    currentProjectId: null,
    sessionName: "untitled_session",
    tracks: [],
    selection: new Set(),
    playhead: 0,
    zoom: 1.4,
    loadingFiles: [],
    past: [],
    future: [],
    status: "Ready",
  });
  localStorage.removeItem(LAST_PROJECT_KEY);
}

/**
 * Delete a saved project AND its referenced audio blobs. Each project owns
 * its audio (no ref counting), so removing the project removes its blobs.
 */
export async function deleteProjectAndAudio(id: string): Promise<void> {
  const record = await getProject(id);
  if (record) {
    for (const t of record.tracks) {
      try {
        await deleteAudio(t.audioId);
      } catch {
        /* keep going even if one delete fails */
      }
    }
  }
  await deleteProject(id);
  if (localStorage.getItem(LAST_PROJECT_KEY) === id) {
    localStorage.removeItem(LAST_PROJECT_KEY);
  }
}

export function getLastProjectId(): string | null {
  return localStorage.getItem(LAST_PROJECT_KEY);
}
