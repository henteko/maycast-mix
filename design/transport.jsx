function Transport({ tool, setTool, zoom, setZoom, playing, setPlaying, selection, projectLength }) {
  const formatTC = (s) => {
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = Math.floor(s % 60).toString().padStart(2, "0");
    const ms = Math.floor((s % 1) * 1000).toString().padStart(3, "0");
    return { mm, ss, ms };
  };
  const cur = formatTC(38.4);
  const total = formatTC(projectLength);
  const selDur = selection.end - selection.start;
  const selTC = formatTC(selDur);

  return (
    <div className="transport">
      <div className="transport-group">
        <button className="tg-btn" title="先頭へ"><Icon name="skip-back" size={14} /></button>
        <button className="tg-btn play" title="再生" onClick={() => setPlaying(!playing)}>
          <Icon name={playing ? "pause" : "play"} size={15} />
        </button>
        <button className="tg-btn" title="末尾へ"><Icon name="skip-fwd" size={14} /></button>
        <button className="tg-btn" title="ループ"><Icon name="loop" size={14} /></button>
      </div>

      <div className="timecode">
        <span>{cur.mm}:{cur.ss}</span>
        <span className="ms">.{cur.ms}</span>
        <span className="total">/ {total.mm}:{total.ss}</span>
      </div>

      <div className="tool-group" role="toolbar">
        <button className={`tool ${tool === "select" ? "is-active" : ""}`} title="選択 (V)" onClick={() => setTool("select")}>
          <Icon name="select" size={14} />
        </button>
        <button className={`tool ${tool === "move" ? "is-active" : ""}`} title="移動 (M)" onClick={() => setTool("move")}>
          <Icon name="move" size={14} />
        </button>
        <button className={`tool ${tool === "cut" ? "is-active" : ""}`} title="カット (C)" onClick={() => setTool("cut")}>
          <Icon name="scissors" size={14} />
        </button>
        <button className={`tool ${tool === "hand" ? "is-active" : ""}`} title="パン (H)" onClick={() => setTool("hand")}>
          <Icon name="hand" size={14} />
        </button>
      </div>

      <div className="zoom">
        <span className="zoom-label">Zoom</span>
        <button className="icon-btn" style={{width: 24, height: 24}} onClick={() => setZoom(Math.max(0.4, zoom - 0.2))}>
          <Icon name="zoom-out" size={13} />
        </button>
        <div className="zoom-track">
          <div className="zoom-fill" style={{ width: `${(zoom / 3) * 100}%` }} />
          <div className="zoom-thumb" style={{ left: `${(zoom / 3) * 100}%` }} />
        </div>
        <button className="icon-btn" style={{width: 24, height: 24}} onClick={() => setZoom(Math.min(3, zoom + 0.2))}>
          <Icon name="zoom-in" size={13} />
        </button>
        <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", minWidth: 32 }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>

      <div className="transport-spacer" />

      <div className="selection-summary">
        <span className="sel-count">2 トラック選択中</span>
        <span className="sel-time">@ 00:38.40</span>
        <div className="sel-actions">
          <button className="sel-action" title="再生位置で分割 (⌘B)"><Icon name="scissors" size={13} /></button>
          <button className="sel-action" title="複製"><Icon name="duplicate" size={13} /></button>
          <button className="sel-action" title="削除"><Icon name="trash" size={13} /></button>
        </div>
      </div>
    </div>
  );
}

window.Transport = Transport;
