/**
 * Compute amplitude peaks for an AudioBuffer.
 *
 * Returns a Float32Array of peak amplitudes in [0, 1], sampled at
 * approximately `peaksPerSec` Hz. Each peak is the max absolute sample value
 * across all channels in that window.
 */
export function computePeaks(buffer: AudioBuffer, peaksPerSec = 40): Float32Array {
  const totalPeaks = Math.max(1, Math.ceil(buffer.duration * peaksPerSec));
  const samplesPerPeak = Math.max(1, Math.floor(buffer.length / totalPeaks));
  const channels = buffer.numberOfChannels;
  const out = new Float32Array(totalPeaks);

  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < totalPeaks; i++) {
      const start = i * samplesPerPeak;
      const end = Math.min(data.length, start + samplesPerPeak);
      let peak = 0;
      for (let s = start; s < end; s++) {
        const v = Math.abs(data[s]);
        if (v > peak) peak = v;
      }
      if (peak > out[i]) out[i] = peak;
    }
  }
  // Normalize to a comfortable visual range (clamp to [0,1])
  let max = 0;
  for (let i = 0; i < out.length; i++) if (out[i] > max) max = out[i];
  if (max > 0 && max < 1) {
    const scale = Math.min(1 / max, 1.6);
    for (let i = 0; i < out.length; i++) out[i] = Math.min(1, out[i] * scale);
  }
  return out;
}

/**
 * Slice peaks to the range of a clip [offset, offset + duration].
 *
 * Uses floor for both ends so that two clips meeting at a split boundary
 * tile the source peaks exactly — peak N belongs to the second half only,
 * never appearing in both halves nor missing from both.
 */
export function slicePeaks(
  peaks: Float32Array,
  peaksPerSec: number,
  offset: number,
  duration: number,
): Float32Array {
  const start = Math.max(0, Math.floor(offset * peaksPerSec));
  const end = Math.min(
    peaks.length,
    Math.floor((offset + duration) * peaksPerSec),
  );
  if (end <= start) return new Float32Array(0);
  return peaks.subarray(start, end);
}
