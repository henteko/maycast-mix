import type { JSX } from "react";

interface Props {
  name: string;
  size?: number;
}

export function Icon({ name, size = 16 }: Props) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const map: Record<string, JSX.Element> = {
    logo: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M5 14V10M9 17V7M13 19V5M17 16V8M21 14V10"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
    play: (
      <svg {...props} fill="currentColor" stroke="none">
        <path d="M7 5.5v13a.5.5 0 0 0 .76.43l11-6.5a.5.5 0 0 0 0-.86l-11-6.5A.5.5 0 0 0 7 5.5z" />
      </svg>
    ),
    pause: (
      <svg {...props} fill="currentColor" stroke="none">
        <rect x="6.5" y="5" width="4" height="14" rx="0.5" />
        <rect x="13.5" y="5" width="4" height="14" rx="0.5" />
      </svg>
    ),
    "skip-back": (
      <svg {...props}>
        <polygon points="19 20 9 12 19 4 19 20" fill="currentColor" />
        <line x1="5" x2="5" y1="5" y2="19" />
      </svg>
    ),
    "skip-fwd": (
      <svg {...props}>
        <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" />
        <line x1="19" x2="19" y1="5" y2="19" />
      </svg>
    ),
    loop: (
      <svg {...props}>
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    select: (
      <svg {...props}>
        <path d="M3 3h6M3 3v6M21 3h-6M21 3v6M3 21h6M3 21v-6M21 21h-6M21 21v-6" />
      </svg>
    ),
    scissors: (
      <svg {...props}>
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" x2="8.12" y1="4" y2="15.88" />
        <line x1="14.47" x2="20" y1="14.48" y2="20" />
        <line x1="8.12" x2="12" y1="8.12" y2="12" />
      </svg>
    ),
    move: (
      <svg {...props}>
        <polyline points="5 9 2 12 5 15" />
        <polyline points="9 5 12 2 15 5" />
        <polyline points="15 19 12 22 9 19" />
        <polyline points="19 9 22 12 19 15" />
        <line x1="2" x2="22" y1="12" y2="12" />
        <line x1="12" x2="12" y1="2" y2="22" />
      </svg>
    ),
    hand: (
      <svg {...props}>
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </svg>
    ),
    "zoom-in": (
      <svg {...props}>
        <circle cx="11" cy="11" r="7" />
        <line x1="21" x2="16.65" y1="21" y2="16.65" />
        <line x1="11" x2="11" y1="8" y2="14" />
        <line x1="8" x2="14" y1="11" y2="11" />
      </svg>
    ),
    "zoom-out": (
      <svg {...props}>
        <circle cx="11" cy="11" r="7" />
        <line x1="21" x2="16.65" y1="21" y2="16.65" />
        <line x1="8" x2="14" y1="11" y2="11" />
      </svg>
    ),
    upload: (
      <svg {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" x2="12" y1="3" y2="15" />
      </svg>
    ),
    download: (
      <svg {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </svg>
    ),
    trash: (
      <svg {...props}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
    duplicate: (
      <svg {...props}>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
    settings: (
      <svg {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    help: (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" x2="12.01" y1="17" y2="17" />
      </svg>
    ),
    plus: (
      <svg {...props}>
        <line x1="12" x2="12" y1="5" y2="19" />
        <line x1="5" x2="19" y1="12" y2="12" />
      </svg>
    ),
    undo: (
      <svg {...props}>
        <path d="M3 7v6h6" />
        <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
      </svg>
    ),
    redo: (
      <svg {...props}>
        <path d="M21 7v6h-6" />
        <path d="M3 17a9 9 0 0 1 15-6.7L21 13" />
      </svg>
    ),
    sliders: (
      <svg {...props}>
        <line x1="4" x2="4" y1="21" y2="14" />
        <line x1="4" x2="4" y1="10" y2="3" />
        <line x1="12" x2="12" y1="21" y2="12" />
        <line x1="12" x2="12" y1="8" y2="3" />
        <line x1="20" x2="20" y1="21" y2="16" />
        <line x1="20" x2="20" y1="12" y2="3" />
        <line x1="1" x2="7" y1="14" y2="14" />
        <line x1="9" x2="15" y1="8" y2="8" />
        <line x1="17" x2="23" y1="16" y2="16" />
      </svg>
    ),
  };
  return map[name] ?? null;
}
