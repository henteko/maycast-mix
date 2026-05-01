// Inline SVG icons — sized to currentColor
const Icon = ({ name, size = 16 }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "logo":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M5 14V10M9 17V7M13 19V5M17 16V8M21 14V10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      );
    case "play":
      return <svg {...props} fill="currentColor" stroke="none"><path d="M7 5.5v13a.5.5 0 0 0 .76.43l11-6.5a.5.5 0 0 0 0-.86l-11-6.5A.5.5 0 0 0 7 5.5z"/></svg>;
    case "pause":
      return <svg {...props} fill="currentColor" stroke="none"><rect x="6.5" y="5" width="4" height="14" rx="0.5"/><rect x="13.5" y="5" width="4" height="14" rx="0.5"/></svg>;
    case "stop":
      return <svg {...props} fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>;
    case "skip-back":
      return <svg {...props}><polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/><line x1="5" x2="5" y1="5" y2="19"/></svg>;
    case "skip-fwd":
      return <svg {...props}><polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" x2="19" y1="5" y2="19"/></svg>;
    case "rec":
      return <svg {...props} fill="currentColor" stroke="none"><circle cx="12" cy="12" r="6"/></svg>;
    case "loop":
      return <svg {...props}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
    case "select":
      return <svg {...props}><path d="M3 3h6M3 3v6M21 3h-6M21 3v6M3 21h6M3 21v-6M21 21h-6M21 21v-6"/></svg>;
    case "cut":
      return <svg {...props}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" x2="8.12" y1="4" y2="15.88"/><line x1="14.47" x2="20" y1="14.48" y2="20"/><line x1="8.12" x2="12" y1="8.12" y2="12"/></svg>;
    case "scissors":
      return <svg {...props}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" x2="8.12" y1="4" y2="15.88"/><line x1="14.47" x2="20" y1="14.48" y2="20"/><line x1="8.12" x2="12" y1="8.12" y2="12"/></svg>;
    case "move":
      return <svg {...props}><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>;
    case "hand":
      return <svg {...props}><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>;
    case "zoom-in":
      return <svg {...props}><circle cx="11" cy="11" r="7"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>;
    case "zoom-out":
      return <svg {...props}><circle cx="11" cy="11" r="7"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>;
    case "upload":
      return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
    case "download":
      return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
    case "trash":
      return <svg {...props}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
    case "split":
      return <svg {...props}><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3l-7 7M3 21l7-7"/></svg>;
    case "duplicate":
      return <svg {...props}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case "settings":
      return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case "help":
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
    case "plus":
      return <svg {...props}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>;
    case "x":
      return <svg {...props}><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>;
    case "chevron-down":
      return <svg {...props}><polyline points="6 9 12 15 18 9"/></svg>;
    case "magnet":
      return <svg {...props}><path d="M6 13V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8M14 13V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8M6 13a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4M6 13H4M14 13h2M6 7H4M14 7h2"/></svg>;
    case "volume":
      return <svg {...props}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
    case "headphones":
      return <svg {...props}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>;
    case "more":
      return <svg {...props}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;
    case "share":
      return <svg {...props}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>;
    case "fade":
      return <svg {...props}><path d="M3 18 L21 6"/><path d="M3 18 L21 18"/></svg>;
    default: return null;
  }
};

window.Icon = Icon;
