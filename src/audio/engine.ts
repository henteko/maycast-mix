import type { Track } from "../types";
import { getAudioContext } from "./decoder";

interface ScheduledSource {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

/**
 * Realtime playback engine. Holds the AudioContext, master gain, and the set
 * of currently scheduled BufferSources for the in-flight playback.
 *
 * play()/pause() are idempotent and safe to call repeatedly; rebuilding the
 * graph is cheap because we re-create sources from already-decoded buffers.
 */
export class PlaybackEngine {
  private ctx: AudioContext;
  private master: GainNode;
  private sources: ScheduledSource[] = [];
  private startCtxTime = 0;
  private startPlayhead = 0;
  private playing = false;
  private projectLength = 0;
  private onEnded?: () => void;

  constructor() {
    this.ctx = getAudioContext();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
  }

  setOnEnded(cb: () => void) {
    this.onEnded = cb;
  }

  isPlaying() {
    return this.playing;
  }

  /** Resume the AudioContext if suspended (must be called from a user gesture). */
  async ensureRunning() {
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  /**
   * Begin playback at `from` seconds, scheduling every clip across all tracks.
   * Honors mute/solo/volume per the design spec.
   */
  async play(tracks: Track[], from: number, projectLength: number) {
    await this.ensureRunning();
    this.stopAllSources();
    this.projectLength = projectLength;

    const anySolo = tracks.some((t) => t.solo);
    const ctxNow = this.ctx.currentTime + 0.05; // small lead-in for scheduler
    this.startCtxTime = ctxNow;
    this.startPlayhead = from;

    for (const track of tracks) {
      const audible = anySolo ? track.solo : !track.mute;
      if (!audible) continue;

      const trackGain = this.ctx.createGain();
      trackGain.gain.value = track.volume;
      trackGain.connect(this.master);

      for (const clip of track.clips) {
        const clipEnd = clip.start + clip.duration;
        if (clipEnd <= from) continue; // already past

        // Where in the buffer to start this clip.
        let bufOffset = clip.offset;
        let when = ctxNow + (clip.start - from);
        let dur = clip.duration;
        if (clip.start < from) {
          // Mid-clip start: skip into the source buffer.
          const skipped = from - clip.start;
          bufOffset += skipped;
          dur -= skipped;
          when = ctxNow;
        }
        if (dur <= 0) continue;

        const src = this.ctx.createBufferSource();
        src.buffer = track.buffer;
        src.connect(trackGain);
        try {
          src.start(when, bufOffset, dur);
        } catch {
          // start() can throw if when < currentTime — ignore.
          continue;
        }
        this.sources.push({ source: src, gain: trackGain });
      }
    }

    this.playing = true;

    // Schedule a soft "ended" timer at projectLength.
    const remaining = Math.max(0, projectLength - from);
    if (remaining > 0) {
      const handle = window.setTimeout(() => {
        if (this.playing && this.currentTime() >= projectLength - 0.01) {
          this.pause();
          this.onEnded?.();
        }
      }, remaining * 1000 + 50);
      // Stash on the engine so subsequent stops cancel it.
      (this as any)._endTimer = handle;
    }
  }

  pause() {
    if (!this.playing) return;
    // Freeze the current playback position into startPlayhead so subsequent
    // currentTime() calls (after `playing` flips to false) keep returning
    // where playback actually stopped — not where it started.
    const stoppedAt = this.currentTime();
    this.stopAllSources();
    this.playing = false;
    this.startPlayhead = stoppedAt;
  }

  setVolume(v: number) {
    this.master.gain.value = v;
  }

  /** Where is the playhead right now (seconds since start of project)? */
  currentTime(): number {
    if (!this.playing) return this.startPlayhead;
    const elapsed = this.ctx.currentTime - this.startCtxTime;
    const t = this.startPlayhead + Math.max(0, elapsed);
    return Math.min(this.projectLength, t);
  }

  private stopAllSources() {
    for (const s of this.sources) {
      try {
        s.source.stop();
      } catch {
        /* ignore */
      }
      try {
        s.source.disconnect();
        s.gain.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.sources = [];
    const t = (this as any)._endTimer;
    if (t) {
      window.clearTimeout(t);
      (this as any)._endTimer = null;
    }
  }
}
