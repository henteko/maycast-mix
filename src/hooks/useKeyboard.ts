import { useEffect } from "react";
import { useStore } from "../state/store";

interface Args {
  onPlayPause: () => void;
  onOpenFile: () => void;
  onSeekHome: () => void;
  onSeekEnd: () => void;
}

/** Global keyboard shortcuts per SPEC.md §11. */
export function useKeyboard({
  onPlayPause,
  onOpenFile,
  onSeekHome,
  onSeekEnd,
}: Args) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      const s = useStore.getState();

      if (e.code === "Space") {
        e.preventDefault();
        onPlayPause();
        return;
      }
      if (mod && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        s.splitAtPlayhead();
        return;
      }
      if (mod && (e.key === "o" || e.key === "O")) {
        e.preventDefault();
        onOpenFile();
        return;
      }
      if (mod && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        s.selectAll();
        return;
      }
      if (mod && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        s.setZoom(s.zoom + 0.2);
        return;
      }
      if (mod && e.key === "-") {
        e.preventDefault();
        s.setZoom(s.zoom - 0.2);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (s.selection.size > 0) {
          e.preventDefault();
          s.deleteSelection();
        }
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        onSeekHome();
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        onSeekEnd();
        return;
      }

      // Tool shortcuts (no modifier)
      if (!mod && !e.shiftKey && !e.altKey) {
        if (e.key === "v" || e.key === "V") {
          s.setTool("select");
        } else if (e.key === "m" || e.key === "M") {
          s.setTool("move");
        } else if (e.key === "c" || e.key === "C") {
          s.setTool("cut");
        } else if (e.key === "h" || e.key === "H") {
          s.setTool("hand");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPlayPause, onOpenFile, onSeekHome, onSeekEnd]);
}
