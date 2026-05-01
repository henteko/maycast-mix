// Render waveform peaks as filled bars (Descript-style)
function Waveform({ peaks, color = "currentColor", height = 60 }) {
  const w = 800; // viewBox width
  const h = height;
  const mid = h / 2;
  const barW = w / peaks.length;
  // Path uses rectangles via single path of stroked vertical lines
  const lineW = Math.max(1, barW * 0.7);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <g fill={color}>
        {peaks.map((p, i) => {
          const barH = p * (h - 4);
          const x = i * barW;
          return (
            <rect
              key={i}
              x={x + (barW - lineW) / 2}
              y={mid - barH / 2}
              width={lineW}
              height={Math.max(1, barH)}
              rx={lineW / 2}
            />
          );
        })}
      </g>
    </svg>
  );
}

function Clip({ clip, track, pxPerSec, tool, playhead }) {
  const left = clip.start * pxPerSec;
  const width = clip.dur * pxPerSec;
  const fmtDur = (s) => {
    const mm = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${mm}:${ss.toString().padStart(2, "0")}`;
  };
  // Will the playhead split this clip?
  const playheadInside = clip.selected && playhead > clip.start && playhead < clip.start + clip.dur;
  const splitOffsetPx = playheadInside ? (playhead - clip.start) * pxPerSec : null;
  const splittable = playheadInside && tool === "cut";
  return (
    <div
      className={`clip ${clip.selected ? "is-selected" : ""} ${splittable ? "is-splittable" : ""}`}
      style={{
        left,
        width,
        "--clip-bg": track.clipBg,
        "--clip-border": track.clipBorder,
        "--clip-head": track.clipHead,
        "--clip-fg": track.clipFg,
      }}
    >
      <div className="clip-head">
        <span className="clip-name">{clip.name}</span>
        <span className="clip-len">{fmtDur(clip.dur)}</span>
      </div>
      <div className="clip-wave">
        <Waveform peaks={clip.peaks} color={track.waveColor} />
      </div>
      {splittable && (
        <div className="clip-split-preview" style={{ left: splitOffsetPx }}>
          <div className="clip-split-line" />
          <div className="clip-split-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <line x1="20" x2="8.12" y1="4" y2="15.88"/>
              <line x1="14.47" x2="20" y1="14.48" y2="20"/>
              <line x1="8.12" x2="12" y1="8.12" y2="12"/>
            </svg>
            <span>分割</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TrackHeader({ track }) {
  const isSelected = track.clips.some(c => c.selected);
  return (
    <div className={`track-header ${isSelected ? "is-selected" : ""}`}>
      <div className="th-row1">
        <div className="track-color" style={{ background: track.color }} />
        <div className="track-name">{track.name}</div>
      </div>
      <div className="track-meta">{track.meta}</div>
      <div className="th-row2">
        <button className={`th-btn ${track.mute ? "is-on-m" : ""}`} title="ミュート">M</button>
        <button className={`th-btn ${track.solo ? "is-on-s" : ""}`} title="ソロ">S</button>
        <div className="th-vol">
          <div className="th-vol-fill" style={{ width: `${track.volume * 100}%` }} />
          <div className="th-vol-thumb" style={{ left: `${track.volume * 100}%` }} />
        </div>
        <span className="th-db">{track.db}</span>
      </div>
    </div>
  );
}

function Ruler({ projectLength, pxPerSec }) {
  const interval = pxPerSec >= 16 ? 5 : pxPerSec >= 8 ? 10 : 15;
  const minorInterval = interval / 5;
  const ticks = [];
  for (let s = 0; s <= projectLength; s += minorInterval) {
    const isMajor = Math.round(s * 10) % Math.round(interval * 10) === 0;
    const left = s * pxPerSec;
    ticks.push({ s, isMajor, left });
  }
  const fmt = (s) => {
    const mm = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${mm}:${ss.toString().padStart(2, "0")}`;
  };
  return (
    <div className="ruler">
      <div className="ruler-corner">Tracks</div>
      <div className="ruler-scale">
        {ticks.map((t, i) => (
          <React.Fragment key={i}>
            <div className={`ruler-tick ${t.isMajor ? "major" : "minor"}`} style={{ left: t.left }} />
            {t.isMajor && (
              <div className="ruler-label" style={{ left: t.left }}>{fmt(t.s)}</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Tracks({ tracks, projectLength, pxPerSec, selection, playhead, tool }) {
  return (
    <div className="tracks">
      <Ruler projectLength={projectLength} pxPerSec={pxPerSec} />
      {tracks.map(track => {
        const isSelected = track.clips.some(c => c.selected);
        return (
          <div className="track" key={track.id}>
            <TrackHeader track={track} />
            <div className={`track-lane ${isSelected ? "is-selected" : ""}`}>
              {track.clips.map(c => (
                <Clip key={c.id} clip={c} track={track} pxPerSec={pxPerSec} tool={tool} playhead={playhead} />
              ))}
            </div>
          </div>
        );
      })}
      <div className="add-track">
        <div className="add-track-header">
          <button className="add-track-btn">
            <Icon name="plus" size={13} />
            音声を追加
          </button>
        </div>
        <div className="add-track-lane">
          <div className="add-track-hint">
            ファイルをドラッグ&ドロップ または
            <kbd>⌘</kbd><kbd>O</kbd>
            で開く ・ MP3 / WAV / M4A 対応
          </div>
        </div>
      </div>

      {/* Playhead overlay */}
      <PlayheadOverlay pxPerSec={pxPerSec} playhead={playhead} tool={tool} />
    </div>
  );
}

function PlayheadOverlay({ pxPerSec, playhead, tool }) {
  const headerW = 232;
  const ruler = 28;
  const phLeft = headerW + playhead * pxPerSec;
  const fmtTC = (s) => {
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = Math.floor(s % 60).toString().padStart(2, "0");
    const ms = Math.floor((s % 1) * 100).toString().padStart(2, "0");
    return `${mm}:${ss}.${ms}`;
  };
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
      <div
        className={`playhead ${tool === "cut" ? "is-cut" : ""}`}
        style={{
          left: phLeft,
          top: ruler - 6,
          bottom: 56,
        }}
      >
        <div className="playhead-tc">{fmtTC(playhead)}</div>
      </div>
    </div>
  );
}

function SelectionOverlay_OLD() { return null; }
function SelectionOverlay() { return null; }

window.Tracks = Tracks;
