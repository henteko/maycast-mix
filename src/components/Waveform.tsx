import { memo, useEffect, useRef } from "react";
import type { WaveStyle } from "../types";

interface Props {
  peaks: Float32Array;
  color?: string;
  style?: WaveStyle;
}

/**
 * Bar pitch in CSS pixels — same value for every clip so the bar density
 * looks identical no matter how a clip was split. Each bar aggregates
 * however many peak buckets fall under its width.
 */
const BAR_PITCH_CSS = 2.5;
/** Bar width as a fraction of pitch (0.6 leaves a thin gap between bars). */
const BAR_FILL_RATIO = 0.6;

export const Waveform = memo(function Waveform({
  peaks,
  color = "currentColor",
  style = "bars",
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let pendingRaf = 0;
    const draw = () => {
      pendingRaf = 0;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const cssW = Math.max(1, canvas.clientWidth);
      const cssH = Math.max(1, canvas.clientHeight);
      const W = Math.max(1, Math.round(cssW * dpr));
      const H = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      if (peaks.length === 0) return;
      if (style === "line") drawLine(ctx, peaks, W, H, color, dpr);
      else if (style === "filled") drawFilled(ctx, peaks, W, H, color, dpr);
      else drawBars(ctx, peaks, W, H, color, dpr);
    };

    const schedule = () => {
      if (pendingRaf) return;
      pendingRaf = requestAnimationFrame(draw);
    };

    draw();
    const ro = new ResizeObserver(schedule);
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      if (pendingRaf) cancelAnimationFrame(pendingRaf);
    };
  }, [peaks, color, style]);

  return (
    <canvas
      ref={ref}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
});

/**
 * Aggregate `peaks` into the maximum value across the half-open bucket
 * `[a, b)`. Returns 0 for empty buckets so silent regions don't pick up
 * stray values past the array end.
 */
function aggregatePeak(peaks: Float32Array, a: number, b: number): number {
  let p = 0;
  const end = Math.min(b, peaks.length);
  for (let j = Math.max(0, a); j < end; j++) {
    if (peaks[j] > p) p = peaks[j];
  }
  return p;
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  peaks: Float32Array,
  W: number,
  H: number,
  color: string,
  dpr: number,
) {
  ctx.fillStyle = color;
  const mid = H / 2;
  const padding = Math.round(4 * dpr);
  const usable = Math.max(1, H - padding);
  const pitch = Math.max(1, Math.round(BAR_PITCH_CSS * dpr));
  const barW = Math.max(1, Math.round(pitch * BAR_FILL_RATIO));
  // round() so a fractional last bar at the edge fills the canvas cleanly.
  const numBars = Math.max(1, Math.round(W / pitch));
  const radius = Math.min(barW / 2, 2 * dpr);

  for (let i = 0; i < numBars; i++) {
    const a = Math.floor((i / numBars) * peaks.length);
    const b = Math.max(a + 1, Math.floor(((i + 1) / numBars) * peaks.length));
    const p = aggregatePeak(peaks, a, b);
    const barH = Math.max(dpr, p * usable);
    const x = Math.round(i * pitch + (pitch - barW) / 2);
    const y = Math.round(mid - barH / 2);
    const hh = Math.round(barH);
    if (hh > radius * 2 && radius >= 1) {
      roundedRect(ctx, x, y, barW, hh, radius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, barW, hh);
    }
  }
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  peaks: Float32Array,
  W: number,
  H: number,
  color: string,
  dpr: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, dpr);
  ctx.lineJoin = "round";
  const mid = H / 2;
  const usable = (H - 4 * dpr) / 2;
  const pitch = Math.max(1, dpr);
  const numPoints = Math.max(2, Math.round(W / pitch));

  ctx.beginPath();
  for (let i = 0; i < numPoints; i++) {
    const a = Math.floor((i / numPoints) * peaks.length);
    const b = Math.max(a + 1, Math.floor(((i + 1) / numPoints) * peaks.length));
    const p = aggregatePeak(peaks, a, b);
    const x = (i / (numPoints - 1)) * W;
    const y = mid - p * usable;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i < numPoints; i++) {
    const a = Math.floor((i / numPoints) * peaks.length);
    const b = Math.max(a + 1, Math.floor(((i + 1) / numPoints) * peaks.length));
    const p = aggregatePeak(peaks, a, b);
    const x = (i / (numPoints - 1)) * W;
    const y = mid + p * usable;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawFilled(
  ctx: CanvasRenderingContext2D,
  peaks: Float32Array,
  W: number,
  H: number,
  color: string,
  dpr: number,
) {
  const mid = H / 2;
  const usable = (H - 4 * dpr) / 2;
  const pitch = Math.max(1, dpr);
  const numPoints = Math.max(2, Math.round(W / pitch));
  const tops: number[] = new Array(numPoints);
  const bots: number[] = new Array(numPoints);
  const xs: number[] = new Array(numPoints);
  for (let i = 0; i < numPoints; i++) {
    const a = Math.floor((i / numPoints) * peaks.length);
    const b = Math.max(a + 1, Math.floor(((i + 1) / numPoints) * peaks.length));
    const p = aggregatePeak(peaks, a, b);
    xs[i] = (i / (numPoints - 1)) * W;
    tops[i] = mid - p * usable;
    bots[i] = mid + p * usable;
  }
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(xs[0], tops[0]);
  for (let i = 1; i < numPoints; i++) ctx.lineTo(xs[i], tops[i]);
  for (let i = numPoints - 1; i >= 0; i--) ctx.lineTo(xs[i], bots[i]);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
