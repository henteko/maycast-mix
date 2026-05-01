import { Mp3Encoder } from "@breezystack/lamejs";

const SAMPLES_PER_FRAME = 1152;
/**
 * Number of frames to encode in one synchronous burst before yielding to the
 * event loop. ~50 frames ≈ 1.3 s of audio at 44.1 kHz, which is fast enough
 * to keep encoding throughput high while still letting the progress UI
 * repaint a few times per second.
 */
const FRAMES_PER_CHUNK = 50;

/**
 * Encode a stereo (or mono) Float32 AudioBuffer into an MP3 Blob.
 *
 * Yields between chunks so the UI can repaint and the optional `onProgress`
 * callback can drive a progress bar.
 *
 * @param buffer    AudioBuffer rendered by renderMix
 * @param bitrate   kbps (default 320 per spec)
 * @param onProgress called periodically with a value in [0, 1]
 */
export async function encodeMp3(
  buffer: AudioBuffer,
  bitrate = 320,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const channels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const encoder = new Mp3Encoder(channels, sampleRate, bitrate);

  const left = floatTo16(buffer.getChannelData(0));
  const right = channels > 1 ? floatTo16(buffer.getChannelData(1)) : left;

  const chunks: Uint8Array[] = [];
  const total = left.length;
  const samplesPerChunk = SAMPLES_PER_FRAME * FRAMES_PER_CHUNK;

  for (let i = 0; i < total; i += samplesPerChunk) {
    const chunkEnd = Math.min(i + samplesPerChunk, total);
    for (let j = i; j < chunkEnd; j += SAMPLES_PER_FRAME) {
      const l = left.subarray(j, j + SAMPLES_PER_FRAME);
      const r = right.subarray(j, j + SAMPLES_PER_FRAME);
      const encoded =
        channels === 1 ? encoder.encodeBuffer(l) : encoder.encodeBuffer(l, r);
      if (encoded.length > 0) chunks.push(encoded);
    }
    onProgress?.(Math.min(1, chunkEnd / total));
    // Yield so the browser can render the new progress and stay responsive.
    await new Promise<void>((r) => setTimeout(r, 0));
  }

  const tail = encoder.flush();
  if (tail.length > 0) chunks.push(tail);
  onProgress?.(1);

  return new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
}

function floatTo16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}
