function TopBar() {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <Icon name="logo" size={14} />
        </div>
        <div className="brand-name">Maycast<em>Mix</em></div>
      </div>
      <div className="project-meta">
        <strong>untitled_session</strong>
        <span className="dot" />
        <span>5 tracks</span>
        <span className="dot" />
        <span>2 min 12 sec</span>
      </div>
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <button className="btn btn-ghost">
          <Icon name="upload" size={14} />
          音声を追加
        </button>
        <button className="icon-btn" title="設定">
          <Icon name="settings" size={15} />
        </button>
        <button className="icon-btn" title="ヘルプ">
          <Icon name="help" size={15} />
        </button>
        <div style={{ width: 8 }} />
        <button className="btn btn-primary">
          <Icon name="download" size={14} />
          MP3で書き出し
        </button>
      </div>
    </div>
  );
}

window.TopBar = TopBar;
