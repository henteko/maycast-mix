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
}

export interface Track {
  id: string;
  name: string;
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

export interface Tweaks {
  trackHeight: number;
  waveStyle: WaveStyle;
  accentHue: number;
  showSelection: boolean;
  showPlayhead: boolean;
}
