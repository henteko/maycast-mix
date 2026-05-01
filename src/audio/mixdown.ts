import type { Track } from "../types";

/**
 * Render all clips across all tracks to a single stereo AudioBuffer using
 * an OfflineAudioContext. Mute/solo/volume are honored exactly as in
 * realtime playback.
 */
export async function renderMix(
  tracks: Track[],
  projectLength: number,
  sampleRate = 44100,
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
      const src = offline.createBufferSource();
      src.buffer = track.buffer;
      src.connect(trackGain);
      try {
        src.start(clip.start, clip.offset, clip.duration);
      } catch {
        continue;
      }
    }
  }

  return await offline.startRendering();
}
