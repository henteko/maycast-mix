import { useStore } from "../state/store";

export function StatusBar() {
  const tracks = useStore((s) => s.tracks);
  const status = useStore((s) => s.status);
  const exporting = useStore((s) => s.exporting);
  const exportProgress = useStore((s) => s.exportProgress);
  const loadingCount = useStore((s) => s.loadingFiles.length);
  const busy = exporting || loadingCount > 0;

  const totalSamples = tracks.reduce((acc, t) => {
    let len = 0;
    for (const c of t.clips) len += Math.floor(c.duration * t.sampleRate);
    return acc + len;
  }, 0);

  const showProgress = exporting && exportProgress != null;
  const progressPct = showProgress ? Math.round(exportProgress * 100) : 0;

  return (
    <div className="statusbar">
      <span className="sb-item">
        {busy ? <span className="spinner" /> : <span className="sb-pulse" />}
        <strong>
          {exporting
            ? `${status}${showProgress ? ` ${progressPct}%` : ""}`
            : loadingCount > 0
            ? `読み込み中… ${loadingCount} 件`
            : status}
        </strong>
      </span>
      {showProgress && (
        <span className="sb-progress" aria-label="export progress">
          <span
            className="sb-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </span>
      )}
      <span className="sb-item mono">44.1 kHz · 16-bit · Stereo</span>
      <span className="sb-item">
        サンプル数 <strong>{totalSamples.toLocaleString()}</strong>
      </span>
      <div className="sb-spacer" />
      <span className="sb-item">
        エクスポート: <strong>MP3 320kbps</strong>
      </span>
    </div>
  );
}
