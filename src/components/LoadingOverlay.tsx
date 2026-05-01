import { useStore } from "../state/store";

/**
 * Fullscreen overlay shown while a project is being loaded from IndexedDB.
 * Each track's audio has to be re-decoded, which can take a few seconds for
 * larger projects, so we surface progress instead of leaving the editor blank.
 */
export function LoadingOverlay() {
  const loading = useStore((s) => s.projectLoading);
  if (!loading) return null;
  const pct =
    loading.total > 0 ? Math.round((loading.current / loading.total) * 100) : 0;
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-card">
        <div className="spinner-large" />
        <strong className="loading-title">{loading.name}</strong>
        <div className="loading-sub">
          {loading.total > 0
            ? `${loading.current} / ${loading.total} トラックを読み込み中…`
            : "プロジェクトを読み込み中…"}
        </div>
        {loading.total > 0 && (
          <div className="loading-bar" aria-label="loading progress">
            <div
              className="loading-bar-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
