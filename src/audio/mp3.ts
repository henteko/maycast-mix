import { Mp3Encoder } from "@breezystack/lamejs";

const SAMPLES_PER_FRAME = 1152;

/**
 * Encode a stereo (or mono) Float32 AudioBuffer into an MP3 Blob.
 *
 * @param buffer  AudioBuffer rendered by renderMix
 * @param bitrate kbps (default 320 per spec)
 */
export function encodeMp3(buffer: AudioBuffer, bitrate = 320): Blob {
  const channels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const encoder = new Mp3Encoder(channels, sampleRate, bitrate);

  const left = floatTo16(buffer.getChannelData(0));
  const right = channels > 1 ? floatTo16(buffer.getChannelData(1)) : left;

  const chunks: Uint8Array[] = [];
  for (let i = 0; i < left.length; i += SAMPLES_PER_FRAME) {
    const l = left.subarray(i, i + SAMPLES_PER_FRAME);
    const r = right.subarray(i, i + SAMPLES_PER_FRAME);
    const encoded =
      channels === 1 ? encoder.encodeBuffer(l) : encoder.encodeBuffer(l, r);
    if (encoded.length > 0) chunks.push(encoded);
  }
  const tail = encoder.flush();
  if (tail.length > 0) chunks.push(tail);

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
