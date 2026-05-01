import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "./components/TopBar";
import { Transport } from "./components/Transport";
import { Tracks } from "./components/Tracks";
import { StatusBar } from "./components/StatusBar";
import { TweaksPanel } from "./components/TweaksPanel";
import { useKeyboard } from "./hooks/useKeyboard";
import { PlaybackEngine } from "./audio/engine";
import { renderMix } from "./audio/mixdown";
import { encodeMp3 } from "./audio/mp3";
import { projectLength as calcProjectLength, useStore } from "./state/store";

const BASE_PX_PER_SEC = 8;

export function App() {
  const tracks = useStore((s) => s.tracks);
  const zoom = useStore((s) => s.zoom);
  const tool = useStore((s) => s.tool);
  const tweaks = useStore((s) => s.tweaks);
  const playing = useStore((s) => s.playing);
  const setPlaying = useStore((s) => s.setPlaying);
  const setPlayhead = useStore((s) => s.setPlayhead);
  const setStatus = useStore((s) => s.setStatus);
  const setExporting = useStore((s) => s.setExporting);
  const sessionName = useStore((s) => s.sessionName);

  const engineRef = useRef<PlaybackEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // Reactively recompute project length whenever tracks change.
  const projectLength = useMemo(() => calcProjectLength(tracks), [tracks]);
  const pxPerSec = BASE_PX_PER_SEC * zoom;

  // ─── Apply tweaks to CSS variables ───
  useEffect(() => {
    const h = tweaks.accentHue;
    const root = document.documentElement;
    root.style.setProperty("--accent", `oklch(56% 0.16 ${h})`);
    root.style.setProperty("--accent-strong", `oklch(48% 0.18 ${h})`);
    root.style.setProperty("--accent-soft", `oklch(94% 0.04 ${h})`);
    root.style.setProperty("--sel", `oklch(56% 0.16 ${h} / 0.18)`);
    root.style.setProperty("--sel-edge", `oklch(56% 0.16 ${h} / 0.55)`);
  }, [tweaks.accentHue]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--track-h",
      `${tweaks.trackHeight}px`,
    );
  }, [tweaks.trackHeight]);

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
  const handleExport = useCallback(async () => {
    const s = useStore.getState();
    const total = calcProjectLength(s.tracks);
    if (total <= 0 || s.tracks.length === 0) return;
    if (s.playing) {
      engineRef.current?.pause();
      setPlaying(false);
    }
    setExporting(true);
    setStatus("ミックスダウン中…");
    try {
      const buf = await renderMix(s.tracks, total, 44100);
      setStatus("MP3 エンコード中…");
      // Yield to the browser so the status update renders.
      await new Promise((r) => setTimeout(r, 0));
      const blob = encodeMp3(buf, 320);
      const ts = new Date()
        .toISOString()
        .replace(/[-:T]/g, "")
        .slice(0, 14);
      const name = `maycast-mix_${sessionName}_${ts}.mp3`;
      triggerDownload(blob, name);
      setStatus(`書き出し完了: ${name}`);
    } catch (err) {
      console.error(err);
      setStatus("書き出しに失敗しました");
    } finally {
      setExporting(false);
    }
  }, [sessionName, setExporting, setPlaying, setStatus]);

  return (
    <div className="app">
      <TopBar
        onExport={handleExport}
        onToggleTweaks={() => setTweaksOpen((v) => !v)}
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
      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)} />
      <input
        id="__hidden_file_picker"
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
        style={{ display: "none" }}
        onChange={onHiddenFile}
      />
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
