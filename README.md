# Maycast Slice

https://slice.maycast.henteko07.com/

Browser-based multi-track audio editor for podcasts, radio shows, and short-form audio.
All decoding, mixing, and MP3 encoding runs locally in the browser — your audio never
leaves your machine.

> Original feature spec (Japanese): [`design/SPEC.md`](design/SPEC.md)

## Features

- Multi-track timeline with drag-and-drop import (MP3 / WAV / M4A / AAC / OGG / FLAC)
- Click-or-drag select tool: click a clip to select, drag to move; multi-select moves
  the whole group together
- Cut clips at the playhead (`⌘B`) — works across multiple selected tracks
- Per-track mute / solo / volume; mixed real-time playback honors all of them
- 320 kbps MP3 export with progress feedback (mixdown + encode)
- Undo / Redo (`⌘Z` / `⌘⇧Z`) for every edit operation
- Named projects auto-saved to IndexedDB (audio Blob + peaks + metadata); a project
  list lets you reopen any saved session
- Horizontal timeline scrolling for long projects, sticky track headers
- Keyboard shortcuts for every transport / edit action
- Light theme, no telemetry, no backend

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

## Build

```bash
npm run build         # → dist/
npm run preview       # serve the production build locally
```

## Deploy to Cloudflare Pages

The repo includes `wrangler.toml`, `public/_headers`, and `public/_redirects`,
so Cloudflare Pages can serve `dist/` directly.

### Dashboard

1. Push to GitHub
2. Cloudflare → Workers & Pages → Pages → Connect to Git → select repo
3. Configure the project:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variable:** `NODE_VERSION = 20`

### CLI

```bash
npm run deploy
```

The script runs `npm run build` and then `npx wrangler pages deploy`.
First run will prompt for `wrangler login`.

## Tech stack

- React 18 + TypeScript
- Vite (build / dev server)
- Zustand (state)
- Web Audio API (`AudioContext`, `OfflineAudioContext`) for playback and mixdown
- [`@breezystack/lamejs`](https://github.com/shijinyu/lamejs) for MP3 encoding
- IndexedDB for project persistence (audio Blobs + peaks + project records)

## Project structure

```
src/
  audio/
    decoder.ts           shared AudioContext + decodeAudioData wrapper
    engine.ts            realtime playback engine
    mixdown.ts           OfflineAudioContext mixdown with progress
    mp3.ts               lamejs encode (chunked, async, progress)
    peaks.ts             waveform peak computation + slice
  components/            React UI (TopBar, Transport, Tracks, Clip, ...)
  hooks/
    useKeyboard.ts       global shortcut handling
  state/
    palettes.ts          per-track color palettes
    store.ts             Zustand store + editing actions + history
  storage/
    db.ts                IndexedDB wrapper (projects + audio object stores)
    persist.ts           save / load / list / delete projects
  styles.css             light-theme CSS
  App.tsx                composition root, autosave subscription
  main.tsx               entry
  types.ts
public/
  _headers               long-cache for /assets/*; security headers
  _redirects             SPA fallback
design/                  original feature spec + JSX prototype
wrangler.toml            Cloudflare Pages config
```

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / Pause |
| `V` / `M` | Select / move tool |
| `H` | Pan tool |
| `⌘B` / `Ctrl+B` | Split selected tracks at the playhead |
| `⌘O` / `Ctrl+O` | Add audio file(s) |
| `⌘A` / `Ctrl+A` | Select all clips |
| `Delete` / `Backspace` | Delete selected clips |
| `⌘Z` / `Ctrl+Z` | Undo |
| `⌘⇧Z` / `Ctrl+⇧Z` | Redo |
| `Home` / `End` | Jump to start / end |
| `⌘+` / `⌘-` | Zoom in / out |

## Privacy

- Audio is decoded, edited, mixed, and encoded entirely in your browser.
- Project data is persisted only in your browser's IndexedDB.
- Nothing is uploaded to any server.

## Browser support

Latest Chrome, Edge, Safari, Firefox. Requires
[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
and [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).

## Contributing

Issues and pull requests are welcome at
<https://github.com/henteko/maycast-slice>.

## License

Licensed under the [Apache License, Version 2.0](LICENSE).

This project bundles `@breezystack/lamejs`, which is distributed under the
LGPL-3.0 license. Third-party attributions are listed in [NOTICE](NOTICE).
