let sharedCtx: AudioContext | null = null;

/**
 * Returns a singleton AudioContext used for decoding (and as a template for
 * playback when needed). Browsers prefer 44.1 kHz; we explicitly request it
 * so peaks/clips line up with the export sample rate.
 */
export function getAudioContext(): AudioContext {
  if (!sharedCtx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    sharedCtx = new Ctor({ sampleRate: 44100 });
  }
  return sharedCtx;
}

export async function decodeFile(file: File): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuf = await file.arrayBuffer();
  // Some browsers reject the buffer after consumption — make a copy.
  return await ctx.decodeAudioData(arrayBuf.slice(0));
}
