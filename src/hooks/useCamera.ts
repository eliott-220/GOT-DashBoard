import { useCallback, useEffect, useRef, useState } from "react";

export interface CameraState {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const EASE = 0.18;
const IDENTITY: CameraState = { x: 0, y: 0, scale: 1 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Keeps pan within a generous margin around the viewport so the map can
// never be dragged entirely out of sight, while still allowing exploration
// past its edges once zoomed in.
function clampCamera(camera: CameraState, viewportW: number, viewportH: number): CameraState {
  const scale = clamp(camera.scale, MIN_SCALE, MAX_SCALE);
  const maxX = ((scale - 1) * viewportW) / 2 + viewportW * 0.3;
  const maxY = ((scale - 1) * viewportH) / 2 + viewportH * 0.3;
  return {
    scale,
    x: clamp(camera.x, -maxX, maxX),
    y: clamp(camera.y, -maxY, maxY),
  };
}

/**
 * Drives a translate+scale camera over a full-viewport "world" layer.
 * Every move goes through a target value that the render loop eases
 * towards, except drags/pinches which move 1:1 for direct tracking.
 */
export function useCamera(viewportRef: React.RefObject<HTMLElement>) {
  const [camera, setCamera] = useState<CameraState>(IDENTITY);
  const targetRef = useRef<CameraState>(IDENTITY);
  const rafRef = useRef<number | null>(null);

  const getViewportSize = useCallback(() => {
    const rect = viewportRef.current?.getBoundingClientRect();
    return { width: rect?.width ?? 1, height: rect?.height ?? 1 };
  }, [viewportRef]);

  const ensureLoop = useCallback(() => {
    if (rafRef.current != null) return;
    const step = () => {
      setCamera((prev) => {
        const t = targetRef.current;
        const dx = t.x - prev.x;
        const dy = t.y - prev.y;
        const ds = t.scale - prev.scale;
        const settled = Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(ds) < 0.0006;
        if (settled) {
          rafRef.current = null;
          return t;
        }
        rafRef.current = requestAnimationFrame(step);
        return { x: prev.x + dx * EASE, y: prev.y + dy * EASE, scale: prev.scale + ds * EASE };
      });
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  const setTarget = useCallback(
    (next: CameraState, options?: { instant?: boolean }) => {
      const { width, height } = getViewportSize();
      const clamped = clampCamera(next, width, height);
      targetRef.current = clamped;
      if (options?.instant) {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        setCamera(clamped);
      } else {
        ensureLoop();
      }
    },
    [ensureLoop, getViewportSize],
  );

  const zoomAt = useCallback(
    (screenX: number, screenY: number, factor: number, options?: { instant?: boolean }) => {
      const t = targetRef.current;
      const scale = clamp(t.scale * factor, MIN_SCALE, MAX_SCALE);
      const worldX = (screenX - t.x) / t.scale;
      const worldY = (screenY - t.y) / t.scale;
      setTarget({ x: screenX - worldX * scale, y: screenY - worldY * scale, scale }, options);
    },
    [setTarget],
  );

  const panBy = useCallback(
    (dx: number, dy: number, options?: { instant?: boolean }) => {
      const t = targetRef.current;
      setTarget({ x: t.x + dx, y: t.y + dy, scale: t.scale }, options);
    },
    [setTarget],
  );

  const reset = useCallback(() => setTarget(IDENTITY), [setTarget]);

  const isHome = Math.abs(camera.x) < 0.5 && Math.abs(camera.y) < 0.5 && Math.abs(camera.scale - 1) < 0.005;

  return { camera, targetRef, setTarget, zoomAt, panBy, reset, isHome, MIN_SCALE, MAX_SCALE };
}
