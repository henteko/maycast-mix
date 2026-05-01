import type { Track } from "../types";

/**
 * Render all clips across all tracks to a single stereo AudioBuffer using
 * an OfflineAudioContext. Mute/solo/volume are honored exactly as in
 * realtime playback.
 *
 * If `onProgress` is supplied, we schedule periodic suspends in the offline
 * context and report progress as 0..1 of project time. The Web Audio API
 * doesn't expose native progress events on offline rendering, so suspend +
 * resume is the supported way to observe partial completion.
 */
export async function renderMix(
  tracks: Track[],
  projectLength: number,
  sampleRate = 44100,
  onProgress?: (p: number) => void,
): Promise<AudioBuffer> {
  const length = Math.max(1, Math.ceil(projectLength * sampleRate));
  const offline = new OfflineAudioContext(2, length, sampleRate);

  const anySolo = tracks.some((t) => t.solo);

  for (const track of tracks) {
    const audible = anySolo ? track.solo : !track.mute;
    if (!audible) continue;

    const trackGain = offline.createGain();
    trackGain.gain.value = track.volume;
    trackGain.connect(offline.destination);

    for (const clip of track.clips) {
      if (clip.duration <= 0) continue;
      const fadeIn = Math.max(0, Math.min(clip.fadeIn ?? 0, clip.duration));
      const fadeOut = Math.max(
        0,
        Math.min(clip.fadeOut ?? 0, clip.duration - fadeIn),
      );

      const clipGain = offline.createGain();
      clipGain.connect(trackGain);
      if (fadeIn > 0) {
        clipGain.gain.setValueAtTime(0, clip.start);
        clipGain.gain.linearRampToValueAtTime(1, clip.start + fadeIn);
      }
      if (fadeOut > 0) {
        const fadeOutStart = clip.start + clip.duration - fadeOut;
        clipGain.gain.setValueAtTime(1, fadeOutStart);
        clipGain.gain.linearRampToValueAtTime(0, fadeOutStart + fadeOut);
      }

      const src = offline.createBufferSource();
      src.buffer = track.buffer;
      src.connect(clipGain);
      try {
        src.start(clip.start, clip.offset, clip.duration);
      } catch {
        continue;
      }
    }
  }

  if (onProgress && projectLength > 0) {
    // Pre-arm a series of suspend points; each fires when the offline
    // context's clock crosses that time. We resume immediately so rendering
    // continues. We aim for ~20 reports across the whole render.
    const STEPS = 20;
    for (let i = 1; i < STEPS; i++) {
      const frac = i / STEPS;
      const t = Math.min(projectLength * 0.999, frac * projectLength);
      offline
        .suspend(t)
        .then(() => {
          onProgress(frac);
          offline.resume();
        })
        .catch(() => {
          /* the context may complete before some suspends fire; ignore */
        });
    }
  }

  const buffer = await offline.startRendering();
  onProgress?.(1);
  return buffer;
}
