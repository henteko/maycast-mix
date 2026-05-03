import type { Clip, ClipPalette } from "../types";

const DB_NAME = "maycast-slice";
// Bumped from 1 → 2 because an earlier WIP build shipped v2 with the same
// schema, leaving some users with a v2 store on disk that v1 can't open
// (VersionError). The upgrade handler is idempotent, so re-running it on
// fresh installs is safe.
const DB_VERSION = 2;
const PROJECTS_STORE = "projects";
const AUDIO_STORE = "audio";

let _dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        // Keyed externally (audioId), value is AudioRecord.
        db.createObjectStore(AUDIO_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function reqAsPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txComplete(t: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export interface AudioRecord {
  /** The original encoded file (mp3/wav/m4a/...). */
  blob: Blob;
  /** Pre-computed amplitude peaks for the entire buffer. */
  peaks: Float32Array;
  peaksPerSec: number;
  sampleRate: number;
  channels: number;
  /** Original filename for restoring track display name. */
  filename: string;
}

export async function putAudio(audioId: string, rec: AudioRecord): Promise<void> {
  const db = await openDB();
  const t = db.transaction(AUDIO_STORE, "readwrite");
  t.objectStore(AUDIO_STORE).put(rec, audioId);
  await txComplete(t);
}

export async function getAudio(audioId: string): Promise<AudioRecord | undefined> {
  const db = await openDB();
  const t = db.transaction(AUDIO_STORE, "readonly");
  return reqAsPromise(t.objectStore(AUDIO_STORE).get(audioId)) as Promise<
    AudioRecord | undefined
  >;
}

export async function deleteAudio(audioId: string): Promise<void> {
  const db = await openDB();
  const t = db.transaction(AUDIO_STORE, "readwrite");
  t.objectStore(AUDIO_STORE).delete(audioId);
  await txComplete(t);
}

export interface PersistedTrack {
  id: string;
  name: string;
  audioId: string;
  meta: string;
  palette: ClipPalette;
  volume: number;
  mute: boolean;
  solo: boolean;
  clips: Clip[];
}

export interface ProjectRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tracks: PersistedTrack[];
  zoom: number;
  playhead: number;
}

/** Lightweight metadata used for the project list (no clips/peaks). */
export interface ProjectListEntry {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  trackCount: number;
}

export async function putProject(p: ProjectRecord): Promise<void> {
  const db = await openDB();
  const t = db.transaction(PROJECTS_STORE, "readwrite");
  t.objectStore(PROJECTS_STORE).put(p);
  await txComplete(t);
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
  const db = await openDB();
  const t = db.transaction(PROJECTS_STORE, "readonly");
  return reqAsPromise(t.objectStore(PROJECTS_STORE).get(id)) as Promise<
    ProjectRecord | undefined
  >;
}

export async function listProjects(): Promise<ProjectListEntry[]> {
  const db = await openDB();
  const t = db.transaction(PROJECTS_STORE, "readonly");
  const all = await reqAsPromise(t.objectStore(PROJECTS_STORE).getAll());
  return (all as ProjectRecord[])
    .map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      trackCount: p.tracks.length,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  const t = db.transaction(PROJECTS_STORE, "readwrite");
  t.objectStore(PROJECTS_STORE).delete(id);
  await txComplete(t);
}
