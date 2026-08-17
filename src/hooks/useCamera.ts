import { useCallback, useEffect, useRef, useState } from "react";

export interface CameraState {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DEFAULT_EASE = 0.18;
const IDENTITY: CameraState = { x: 0, y: 0, scale: 1 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// The map's home (unscaled) bounding box within the viewport, matching the
// CSS object-fit: contain layout used at scale 1.
function contentBox(viewportW: number, viewportH: number, contentAspect: number) {
  const viewportAspect = viewportW / viewportH;
  if (viewportAspect > contentAspect) {
    const height = viewportH;
    const width = height * contentAspect;
    return { left: (viewportW - width) / 2, top: 0, width, height };
  }
  const width = viewportW;
  const height = width / contentAspect;
  return { left: 0, top: (viewportH - height) / 2, width, height };
}

// Clamps pan so any point within the map's content box can still be
// centered at the current scale (needed for focusOn to reach corner
// castles), with a small padding so the map never fully leaves view.
function clampCamera(
  camera: CameraState,
  viewportW: number,
  viewportH: number,
  contentAspect: number,
): CameraState {
  const scale = clamp(camera.scale, MIN_SCALE, MAX_SCALE);
  const box = contentBox(viewportW, viewportH, contentAspect);
  const padX = viewportW * 0.15;
  const padY = viewportH * 0.15;
  const minX = viewportW / 2 - (box.left + box.width) * scale - padX;
  const maxX = viewportW / 2 - box.left * scale + padX;
  const minY = viewportH / 2 - (box.top + box.height) * scale - padY;
  const maxY = viewportH / 2 - box.top * scale + padY;
  return {
    scale,
    x: clamp(camera.x, minX, maxX),
    y: clamp(camera.y, minY, maxY),
  };
}

/**
 * Drives a translate+scale camera over a full-viewport "world" layer.
 * Every move goes through a target value that the render loop eases
 * towards, except drags/pinches which move 1:1 for direct tracking.
 */
export function useCamera(viewportRef: React.RefObject<HTMLElement>, contentAspect: number) {
  const [camera, setCamera] = useState<CameraState>(IDENTITY);
  const targetRef = useRef<CameraState>(IDENTITY);
  const rafRef = useRef<number | null>(null);
  const easeRef = useRef(DEFAULT_EASE);

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
        const ease = easeRef.current;
        return { x: prev.x + dx * ease, y: prev.y + dy * ease, scale: prev.scale + ds * ease };
      });
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  const setTarget = useCallback(
    (next: CameraState, options?: { instant?: boolean; ease?: number }) => {
      const { width, height } = getViewportSize();
      const clamped = clampCamera(next, width, height, contentAspect);
      targetRef.current = clamped;
      if (options?.instant) {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        setCamera(clamped);
      } else {
        easeRef.current = options?.ease ?? DEFAULT_EASE;
        ensureLoop();
      }
    },
    [ensureLoop, getViewportSize, contentAspect],
  );

  const zoomAt = useCallback(
    (screenX: number, screenY: number, factor: number, options?: { instant?: boolean; ease?: number }) => {
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

  // Converts a point in viewport pixels to world space (the coordinate
  // system the map lives in before any pan/zoom is applied), using the
  // camera's current rendered position.
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => ({
      x: (screenX - camera.x) / camera.scale,
      y: (screenY - camera.y) / camera.scale,
    }),
    [camera],
  );

  // Eases the camera so the given world point ends up centered at the
  // given scale — the "travel to a place" primitive used for castle clicks.
  const focusOn = useCallback(
    (worldX: number, worldY: number, scale: number, options?: { ease?: number }) => {
      const { width, height } = getViewportSize();
      const s = clamp(scale, MIN_SCALE, MAX_SCALE);
      setTarget({ x: width / 2 - worldX * s, y: height / 2 - worldY * s, scale: s }, options);
    },
    [getViewportSize, setTarget],
  );

  const reset = useCallback(() => setTarget(IDENTITY), [setTarget]);

  const isHome = Math.abs(camera.x) < 0.5 && Math.abs(camera.y) < 0.5 && Math.abs(camera.scale - 1) < 0.005;

  return {
    camera,
    targetRef,
    setTarget,
    zoomAt,
    panBy,
    screenToWorld,
    focusOn,
    reset,
    isHome,
    MIN_SCALE,
    MAX_SCALE,
  };
}
