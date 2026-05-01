import type { ClipPalette } from "../types";

/**
 * Per-track color palettes. Cycles through 6 hues (blue / cyan / orange /
 * magenta / green / amber) so consecutive uploads are visually distinct.
 */
export const PALETTES: ClipPalette[] = [
  {
    color: "oklch(62% 0.13 250)",
    clipBg: "oklch(96% 0.04 250)",
    clipBorder: "oklch(78% 0.08 250)",
    clipHead: "oklch(88% 0.08 250)",
    clipFg: "oklch(28% 0.08 250)",
    waveColor: "oklch(52% 0.14 250)",
  },
  {
    color: "oklch(64% 0.12 180)",
    clipBg: "oklch(96% 0.035 180)",
    clipBorder: "oklch(78% 0.07 180)",
    clipHead: "oklch(88% 0.07 180)",
    clipFg: "oklch(28% 0.06 180)",
    waveColor: "oklch(48% 0.12 180)",
  },
  {
    color: "oklch(66% 0.13 35)",
    clipBg: "oklch(96% 0.045 35)",
    clipBorder: "oklch(78% 0.09 35)",
    clipHead: "oklch(88% 0.1 35)",
    clipFg: "oklch(32% 0.08 35)",
    waveColor: "oklch(56% 0.14 35)",
  },
  {
    color: "oklch(60% 0.14 320)",
    clipBg: "oklch(96% 0.045 320)",
    clipBorder: "oklch(78% 0.09 320)",
    clipHead: "oklch(88% 0.1 320)",
    clipFg: "oklch(30% 0.1 320)",
    waveColor: "oklch(54% 0.16 320)",
  },
  {
    color: "oklch(64% 0.13 145)",
    clipBg: "oklch(96% 0.04 145)",
    clipBorder: "oklch(78% 0.08 145)",
    clipHead: "oklch(88% 0.09 145)",
    clipFg: "oklch(28% 0.07 145)",
    waveColor: "oklch(50% 0.13 145)",
  },
  {
    color: "oklch(62% 0.14 70)",
    clipBg: "oklch(96% 0.04 70)",
    clipBorder: "oklch(78% 0.08 70)",
    clipHead: "oklch(88% 0.09 70)",
    clipFg: "oklch(28% 0.08 70)",
    waveColor: "oklch(54% 0.14 70)",
  },
];

export function paletteForIndex(i: number): ClipPalette {
  return PALETTES[i % PALETTES.length];
}
