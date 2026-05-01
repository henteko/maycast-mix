// Sample data — multi-track mock
// Time unit: seconds. Pixels per second is computed in app.

// Generate a deterministic waveform peaks array.
function makePeaks(seed, length, profile = "speech") {
  const out = [];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < length; i++) {
    const t = i / length;
    let envelope;
    if (profile === "speech") {
      // pause-burst-pause pattern
      const phase = (t * 7) % 1;
      const burst = phase < 0.1 || phase > 0.85 ? 0.15 : 0.55 + Math.sin(phase * 8) * 0.25;
      envelope = burst;
    } else if (profile === "music") {
      envelope = 0.55 + Math.sin(t * 12) * 0.18 + Math.sin(t * 30) * 0.08;
    } else if (profile === "ambient") {
      envelope = 0.25 + Math.sin(t * 4) * 0.08;
    } else if (profile === "intro") {
      // ramp up
      envelope = 0.2 + t * 0.5;
    } else {
      envelope = 0.4;
    }
    const noise = rand() * 0.45 + 0.55;
    const v = Math.max(0.02, Math.min(1, envelope * noise));
    out.push(v);
  }
  return out;
}

const TRACKS = [
  {
    id: "t1",
    name: "Host - Mika.wav",
    color: "var(--wf-1)",
    clipBg: "oklch(96% 0.04 250)",
    clipBorder: "oklch(78% 0.08 250)",
    clipHead: "oklch(88% 0.08 250)",
    clipFg: "oklch(28% 0.08 250)",
    waveColor: "oklch(52% 0.14 250)",
    meta: "44.1 kHz · Mono",
    volume: 0.78,
    db: "-2.1",
    mute: false, solo: false,
    clips: [
      { id: "c1a", name: "intro_take03", start: 0, dur: 18.5, peaks: makePeaks(11, 240, "intro"), selected: false },
      { id: "c1b", name: "main_segment", start: 19.2, dur: 84, peaks: makePeaks(12, 540, "speech"), selected: true },
      { id: "c1c", name: "outro", start: 106, dur: 22, peaks: makePeaks(13, 280, "speech"), selected: false },
    ],
  },
  {
    id: "t2",
    name: "Guest - Tarou.wav",
    color: "var(--wf-2)",
    clipBg: "oklch(96% 0.035 180)",
    clipBorder: "oklch(78% 0.07 180)",
    clipHead: "oklch(88% 0.07 180)",
    clipFg: "oklch(28% 0.06 180)",
    waveColor: "oklch(48% 0.12 180)",
    meta: "44.1 kHz · Mono",
    volume: 0.72,
    db: "-3.8",
    mute: false, solo: false,
    clips: [
      { id: "c2a", name: "guest_main", start: 6.5, dur: 96, peaks: makePeaks(21, 600, "speech"), selected: true },
      { id: "c2b", name: "outro_response", start: 105, dur: 18, peaks: makePeaks(22, 240, "speech"), selected: false },
    ],
  },
  {
    id: "t3",
    name: "BGM - lofi_loop.mp3",
    color: "var(--wf-3)",
    clipBg: "oklch(96% 0.045 35)",
    clipBorder: "oklch(78% 0.09 35)",
    clipHead: "oklch(88% 0.1 35)",
    clipFg: "oklch(32% 0.08 35)",
    waveColor: "oklch(56% 0.14 35)",
    meta: "44.1 kHz · Stereo",
    volume: 0.32,
    db: "-12.4",
    mute: false, solo: false,
    clips: [
      { id: "c3a", name: "bed_pt1", start: 0, dur: 64, peaks: makePeaks(31, 420, "music"), selected: false },
      { id: "c3b", name: "bed_pt2", start: 66, dur: 62, peaks: makePeaks(32, 400, "music"), selected: false },
    ],
  },
  {
    id: "t4",
    name: "SFX - jingle.wav",
    color: "var(--wf-4)",
    clipBg: "oklch(96% 0.045 320)",
    clipBorder: "oklch(78% 0.09 320)",
    clipHead: "oklch(88% 0.1 320)",
    clipFg: "oklch(30% 0.1 320)",
    waveColor: "oklch(54% 0.16 320)",
    meta: "48 kHz · Stereo",
    volume: 0.55,
    db: "-6.2",
    mute: false, solo: false,
    clips: [
      { id: "c4a", name: "transition_a", start: 18, dur: 3.2, peaks: makePeaks(41, 60, "music"), selected: false },
      { id: "c4b", name: "transition_b", start: 64.5, dur: 3.0, peaks: makePeaks(42, 58, "music"), selected: false },
      { id: "c4c", name: "outro_tail", start: 124, dur: 4.5, peaks: makePeaks(43, 70, "music"), selected: false },
    ],
  },
  {
    id: "t5",
    name: "Ambience - room_tone.wav",
    color: "var(--wf-5)",
    clipBg: "oklch(96% 0.04 145)",
    clipBorder: "oklch(78% 0.08 145)",
    clipHead: "oklch(88% 0.09 145)",
    clipFg: "oklch(28% 0.07 145)",
    waveColor: "oklch(50% 0.13 145)",
    meta: "44.1 kHz · Stereo",
    volume: 0.18,
    db: "-18.0",
    mute: true, solo: false,
    clips: [
      { id: "c5a", name: "room_tone_full", start: 0, dur: 128, peaks: makePeaks(51, 700, "ambient"), selected: false },
    ],
  },
];

// Total project length in seconds (visible)
const PROJECT_LENGTH = 132;

// Selection range (across selected tracks)
const SELECTION = {
  start: 19.2,
  end: 58.0,
};

// Playhead position in seconds
const PLAYHEAD = 38.4;

window.MAYCAST = { TRACKS, PROJECT_LENGTH, SELECTION, PLAYHEAD, makePeaks };
