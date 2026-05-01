import { Fragment } from "react";

interface Props {
  projectLength: number;
  pxPerSec: number;
  laneWidth: number;
  onSeek: (t: number) => void;
}

export function Ruler({ projectLength, pxPerSec, laneWidth, onSeek }: Props) {
  const interval = pxPerSec >= 16 ? 5 : pxPerSec >= 8 ? 10 : 15;
  const minorInterval = interval / 5;
  const totalSec = laneWidth / pxPerSec;
  const ticks: { s: number; isMajor: boolean; left: number }[] = [];
  for (let s = 0; s <= totalSec; s += minorInterval) {
    const isMajor = Math.round(s * 10) % Math.round(interval * 10) === 0;
    ticks.push({ s, isMajor, left: s * pxPerSec });
  }
  const fmt = (s: number) => {
    const mm = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${mm}:${ss.toString().padStart(2, "0")}`;
  };

  // Suppress unused if compiler warns; keep prop for clarity in callers.
  void projectLength;

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    onSeek(Math.max(0, x / pxPerSec));
  };

  return (
    <div className="ruler">
      <div className="ruler-corner">Tracks</div>
      <div
        className="ruler-scale"
        style={{ cursor: "text", width: laneWidth }}
        onClick={onClick}
      >
        {ticks.map((t, i) => (
          <Fragment key={i}>
            <div
              className={`ruler-tick ${t.isMajor ? "major" : "minor"}`}
              style={{ left: t.left }}
            />
            {t.isMajor && (
              <div className="ruler-label" style={{ left: t.left }}>
                {fmt(t.s)}
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
