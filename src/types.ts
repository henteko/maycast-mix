/**
 * Editor tools. Select handles click-to-select and drag-to-move; Hand
 * scrolls the timeline. Splitting at the playhead is invoked via ⌘B or
 * the toolbar split button rather than a dedicated tool.
 */
export type Tool = "select" | "hand";

export type WaveStyle = "bars" | "line" | "filled";

export interface ClipPalette {
  color: string;
  clipBg: string;
  clipBorder: string;
  clipHead: string;
  clipFg: string;
  waveColor: string;
}

export interface Clip {
  id: string;
  trackId: string;
  name: string;
  /** Position on the timeline in seconds */
  start: number;
  /** Offset into the source AudioBuffer in seconds */
  offset: number;
  /** Length of the clip in seconds */
  duration: number;
  /**
   * Linear fade-in duration in seconds, applied from the clip's leading
   * edge. Optional; absent / 0 means no fade. Clamped at render time so
   * fadeIn + fadeOut never exceeds duration.
   */
  fadeIn?: number;
  /** Linear fade-out duration in seconds, applied to the trailing edge. */
  fadeOut?: number;
}

export interface Track {
  id: string;
  name: string;
  /**
   * Persisted audio key — references the encoded blob + peaks stored in
   * IndexedDB. Set when a file is added; reused by the project on save/load.
   */
  audioId: string;
  buffer: AudioBuffer;
  /**
   * Pre-computed peak amplitudes (0..1) for the entire source buffer,
   * sampled at `peaksPerSec` Hz. Used for waveform display.
   */
  peaks: Float32Array;
  peaksPerSec: number;
  sampleRate: number;
  channels: number;
  meta: string;
  palette: ClipPalette;
  /** 0..1 (linear gain) */
  volume: number;
  mute: boolean;
  solo: boolean;
  clips: Clip[];
}

export interface LoadingFile {
  id: string;
  name: string;
}

export interface ProjectLoadingState {
  name: string;
  current: number;
  total: number;
}

