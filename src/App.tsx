import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "./components/TopBar";
import { Transport } from "./components/Transport";
import { Tracks } from "./components/Tracks";
import { StatusBar } from "./components/StatusBar";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { useKeyboard } from "./hooks/useKeyboard";
import { PlaybackEngine } from "./audio/engine";
import { renderMix } from "./audio/mixdown";
import { encodeMp3 } from "./audio/mp3";
import { createZip, type ZipFile } from "./audio/zip";
import { projectLength as calcProjectLength, useStore } from "./state/store";
import { saveCurrentProject } from "./storage/persist";

const BASE_PX_PER_SEC = 8;

export function App() {
  const tracks = useStore((s) => s.tracks);
  const zoom = useStore((s) => s.zoom);
  const tool = useStore((s) => s.tool);
  const playing = useStore((s) => s.playing);
  const setPlaying = useStore((s) => s.setPlaying);
  const setPlayhead = useStore((s) => s.setPlayhead);
  const setStatus = useStore((s) => s.setStatus);
  const setExporting = useStore((s) => s.setExporting);
  const setExportProgress = useStore((s) => s.setExportProgress);
  const sessionName = useStore((s) => s.sessionName);

  const engineRef = useRef<PlaybackEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Reactively recompute project length whenever tracks change.
  const projectLength = useMemo(() => calcProjectLength(tracks), [tracks]);
  const pxPerSec = BASE_PX_PER_SEC * zoom;

  // ─── Bootstrap: always start with a blank session. ───
  // Saved projects stay in IndexedDB and can be reopened via the project menu.
  useEffect(() => {
    setBootstrapped(true);
  }, []);

  // ─── Auto-save: debounced 800ms after the last edit. ───
  // Only kicks in after bootstrap completes so we don't immediately re-save
  // a freshly-loaded project.
  useEffect(() => {
    if (!bootstrapped) return;
    let timer: number | null = null;
    let last = {
      tracks: useStore.getState().tracks,
      sessionName: useStore.getState().sessionName,
      zoom: useStore.getState().zoom,
    };
    const unsub = useStore.subscribe((s) => {
      const changed =
        s.tracks !== last.tracks ||
        s.sessionName !== last.sessionName ||
        s.zoom !== last.zoom;
      if (!changed) return;
      last = { tracks: s.tracks, sessionName: s.sessionName, zoom: s.zoom };
      if (s.tracks.length === 0 && s.currentProjectId == null) return; // empty + unsaved
      useStore.setState({ status: "Saving…" });
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        try {
          await saveCurrentProject();
          useStore.setState({ status: "Saved" });
        } catch (err) {
          console.error("Auto-save failed", err);
          useStore.setState({ status: "Save failed" });
        }
      }, 800);
    });
    return () => {
      unsub();
      if (timer) window.clearTimeout(timer);
    };
  }, [bootstrapped]);

  // ─── Engine lifecycle ───
  useEffect(() => {
    const eng = new PlaybackEngine();
    eng.setOnEnded(() => {
      setPlaying(false);
    });
    engineRef.current = eng;
    return () => {
      eng.pause();
    };
  }, [setPlaying]);

  // ─── rAF playhead update during playback ───
  useEffect(() => {
    if (!playing) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    const tick = () => {
      const eng = engineRef.current;
      if (!eng) return;
      setPlayhead(eng.currentTime());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [playing, setPlayhead]);

  // ─── Cursor based on tool ───
  useEffect(() => {
    if (tool === "hand") {
      document.body.style.cursor = "grab";
    } else {
      document.body.style.cursor = "";
    }
  }, [tool]);

  // ─── Pan tool drag-scroll ───
  useEffect(() => {
    if (tool !== "hand") return;
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest(".track-header")) return;
      const tracksEl = document.querySelector(".tracks") as HTMLElement | null;
      if (!tracksEl) return;
      const startX = e.clientX;
      const startScroll = tracksEl.scrollLeft;
      document.body.style.cursor = "grabbing";
      const move = (ev: MouseEvent) => {
        tracksEl.scrollLeft = startScroll - (ev.clientX - startX);
      };
      const up = () => {
        document.body.style.cursor = "grab";
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [tool]);

  // ─── Wheel-zoom (⌘ + scroll) ───
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      const s = useStore.getState();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      s.setZoom(s.zoom + delta);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  // ─── Transport handlers ───
  const handlePlayPause = useCallback(async () => {
    const eng = engineRef.current;
    if (!eng) return;
    const s = useStore.getState();
    if (s.playing) {
      eng.pause();
      setPlayhead(eng.currentTime());
      setPlaying(false);
    } else {
      if (s.tracks.length === 0) return;
      const total = calcProjectLength(s.tracks);
      if (total <= 0) return;
      const startFrom = s.playhead >= total - 0.01 ? 0 : s.playhead;
      await eng.play(s.tracks, startFrom, total);
      setPlaying(true);
    }
  }, [setPlayhead, setPlaying]);

  const handleSeek = useCallback(
    async (t: number) => {
      const eng = engineRef.current;
      if (!eng) return;
      const s = useStore.getState();
      const total = calcProjectLength(s.tracks);
      const clamped = Math.max(0, Math.min(total, t));
      setPlayhead(clamped);
      if (s.playing) {
        // Re-schedule from new position.
        await eng.play(s.tracks, clamped, total);
      }
    },
    [setPlayhead],
  );

  // When user edits clips during playback, restart the schedule from now.
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng || !playing) return;
    const t = eng.currentTime();
    void eng.play(tracks, t, projectLength);
  }, [tracks, playing, projectLength]);

  // ─── Open file dialog from anywhere ───
  const onOpenFile = useCallback(() => {
    document.getElementById("__hidden_file_picker")?.click();
  }, []);

  const onHiddenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) void useStore.getState().addFiles(files);
    e.target.value = "";
  };

  useKeyboard({
    onPlayPause: handlePlayPause,
    onOpenFile,
    onSeekHome: () => handleSeek(0),
    onSeekEnd: () => handleSeek(projectLength),
  });

  // ─── Export ───
  const handleExport = useCallback(
    async (mode: "mix" | "tracks") => {
      const s = useStore.getState();
      const total = calcProjectLength(s.tracks);
      if (total <= 0 || s.tracks.length === 0) return;
      if (s.playing) {
        engineRef.current?.pause();
        setPlaying(false);
      }
      setExporting(true);
      setExportProgress(0);
      // Progress is split evenly across N outputs (1 for mix, tracks.length
      // for the per-track ZIP). Each output uses the first half of its slice
      // for rendering and the second half for MP3 encoding.
      const totalSteps = mode === "mix" ? 1 : s.tracks.length;
      let done = 0;
      const reportRender = (p: number) => {
        setExportProgress((done + p * 0.5) / totalSteps);
      };
      const reportEncode = (p: number) => {
        setExportProgress((done + 0.5 + p * 0.5) / totalSteps);
      };
      const ts = new Date()
        .toISOString()
        .replace(/[-:T]/g, "")
        .slice(0, 14);
      const baseName = `maycast-slice_${sessionName}_${ts}`;
      try {
        if (mode === "mix") {
          setStatus("Rendering mix…");
          const mixBuf = await renderMix(s.tracks, total, 44100, reportRender);
          setStatus("Encoding mix MP3…");
          // Yield once so the status flip paints before encoding spins up.
          await new Promise((r) => setTimeout(r, 0));
          const mixBlob = await encodeMp3(mixBuf, 320, reportEncode);
          done++;

          const mixName = `${baseName}.mp3`;
          triggerDownload(mixBlob, mixName);
          setStatus(`Exported ${mixName}`);
        } else {
          const trackFiles: ZipFile[] = [];
          const usedNames = new Set<string>();
          for (let i = 0; i < s.tracks.length; i++) {
            const track = s.tracks[i];
            const safe = sanitizeFilenamePart(track.name) || `track-${i + 1}`;
            let fileName = `${String(i + 1).padStart(2, "0")}_${safe}.mp3`;
            // Disambiguate duplicate sanitized names.
            let dedupe = 1;
            while (usedNames.has(fileName)) {
              fileName = `${String(i + 1).padStart(2, "0")}_${safe}_${++dedupe}.mp3`;
            }
            usedNames.add(fileName);

            setStatus(`Rendering track: ${track.name}`);
            // Override mute/solo so each per-track export reflects the
            // track's own audio at its set volume, regardless of editor
            // state.
            const isolated = { ...track, mute: false, solo: false };
            const trackBuf = await renderMix(
              [isolated],
              total,
              44100,
              reportRender,
            );
            setStatus(`Encoding track: ${track.name}`);
            await new Promise((r) => setTimeout(r, 0));
            const trackBlob = await encodeMp3(trackBuf, 320, reportEncode);
            const data = new Uint8Array(await trackBlob.arrayBuffer());
            trackFiles.push({ name: fileName, data });
            done++;
          }

          const zipBlob = createZip(trackFiles);
          const zipName = `${baseName}_tracks.zip`;
          triggerDownload(zipBlob, zipName);
          setStatus(`Exported ${zipName}`);
        }
      } catch (err) {
        console.error(err);
        setStatus("Export failed");
      } finally {
        setExporting(false);
        setExportProgress(null);
      }
    },
    [sessionName, setExporting, setExportProgress, setPlaying, setStatus],
  );

  return (
    <div className="app">
      <TopBar
        onExportMix={() => handleExport("mix")}
        onExportTracks={() => handleExport("tracks")}
      />
      <Transport onPlayPause={handlePlayPause} onSeek={handleSeek} />
      <div className="editor">
        <Tracks
          onSeek={handleSeek}
          pxPerSec={pxPerSec}
          projectLength={projectLength}
        />
      </div>
      <StatusBar />
      <input
        id="__hidden_file_picker"
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
        style={{ display: "none" }}
        onChange={onHiddenFile}
      />
      <LoadingOverlay />
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeFilenamePart(name: string): string {
  return name
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "");
}
