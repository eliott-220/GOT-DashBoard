import { useCallback, useRef } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import mapImage from "../../assets/map/world-map-base.png";
import AmbientLayer from "./AmbientLayer";
import CastleHotspot from "./CastleHotspot";
import { castles, type Castle } from "../data/castles";
import { useCamera } from "../hooks/useCamera";
import "./WorldMap.css";

// Natural pixel dimensions of the base map asset, used to preserve its
// aspect ratio while the viewport is scaled to fit.
const MAP_WIDTH = 1055;
const MAP_HEIGHT = 1024;

const ZOOM_STEP = 1.3;
const KEY_PAN_STEP = 90;
const CASTLE_FOCUS_SCALE = 2.6;
const CASTLE_FOCUS_EASE = 0.09;
const DRAG_THRESHOLD = 5;

interface ActivePointer {
  x: number;
  y: number;
}

export default function WorldMap() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { camera, zoomAt, panBy, setTarget, targetRef, screenToWorld, focusOn, reset, isHome } = useCamera(
    viewportRef,
    MAP_WIDTH / MAP_HEIGHT,
  );

  const pointers = useRef(new Map<number, ActivePointer>());
  const dragRef = useRef<{ startX: number; startY: number; camX: number; camY: number } | null>(null);
  const pinchRef = useRef<{ dist: number; mid: ActivePointer } | null>(null);
  const dragMovedRef = useRef(false);

  const getViewportPoint = useCallback((clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  }, []);

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const { x, y } = getViewportPoint(event.clientX, event.clientY);
      const factor = Math.exp(-event.deltaY * 0.0012);
      zoomAt(x, y, factor);
    },
    [getViewportPoint, zoomAt],
  );

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragRef.current = null;
    pinchRef.current = null;
    dragMovedRef.current = false;
  }, []);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!pointers.current.has(event.pointerId)) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.current.size === 1) {
        const [p] = pointers.current.values();
        const t = targetRef.current;
        if (!dragRef.current) {
          dragRef.current = { startX: p.x, startY: p.y, camX: t.x, camY: t.y };
          return;
        }
        const dx = p.x - dragRef.current.startX;
        const dy = p.y - dragRef.current.startY;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          dragMovedRef.current = true;
        }
        setTarget({ x: dragRef.current.camX + dx, y: dragRef.current.camY + dy, scale: t.scale }, { instant: true });
        return;
      }

      if (pointers.current.size === 2) {
        const [p1, p2] = pointers.current.values();
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const mid = getViewportPoint((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        if (!pinchRef.current) {
          pinchRef.current = { dist, mid };
          return;
        }
        const ratio = dist / pinchRef.current.dist;
        zoomAt(mid.x, mid.y, ratio, { instant: true });
        pinchRef.current = { dist, mid };
      }
    },
    [getViewportPoint, setTarget, targetRef, zoomAt],
  );

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    dragRef.current = null;
    pinchRef.current = null;
  }, []);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const { width, height } = viewportRef.current?.getBoundingClientRect() ?? { width: 0, height: 0 };
      switch (event.key) {
        case "ArrowRight":
          panBy(-KEY_PAN_STEP, 0);
          break;
        case "ArrowLeft":
          panBy(KEY_PAN_STEP, 0);
          break;
        case "ArrowDown":
          panBy(0, -KEY_PAN_STEP);
          break;
        case "ArrowUp":
          panBy(0, KEY_PAN_STEP);
          break;
        case "+":
        case "=":
          zoomAt(width / 2, height / 2, ZOOM_STEP);
          break;
        case "-":
        case "_":
          zoomAt(width / 2, height / 2, 1 / ZOOM_STEP);
          break;
        case "0":
        case "Escape":
          reset();
          break;
        default:
          return;
      }
      event.preventDefault();
    },
    [panBy, reset, zoomAt],
  );

  const handleCastleSelect = useCallback(
    (_castle: Castle, element: HTMLButtonElement) => {
      if (dragMovedRef.current) return;
      const viewportRect = viewportRef.current?.getBoundingClientRect();
      if (!viewportRect) return;
      const elRect = element.getBoundingClientRect();
      const screenX = elRect.left + elRect.width / 2 - viewportRect.left;
      const screenY = elRect.top + elRect.height / 2 - viewportRect.top;
      const world = screenToWorld(screenX, screenY);
      focusOn(world.x, world.y, CASTLE_FOCUS_SCALE, { ease: CASTLE_FOCUS_EASE });
    },
    [focusOn, screenToWorld],
  );

  return (
    <div
      className="world-map-viewport"
      ref={viewportRef}
      tabIndex={0}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      <div
        className="world-map-camera"
        style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}
      >
        <div className="world-map-stage" style={{ aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}>
          <img
            className="world-map-image"
            src={mapImage}
            alt="Carte du royaume"
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            draggable={false}
          />
          <div className="castle-hotspots-layer">
            {castles.map((castle) => (
              <CastleHotspot key={castle.id} castle={castle} onSelect={handleCastleSelect} />
            ))}
          </div>
        </div>
      </div>

      <AmbientLayer />

      <button
        type="button"
        className="world-map-reset"
        onClick={reset}
        aria-label="Revenir à la vue globale"
        style={{ opacity: isHome ? 0 : 1, pointerEvents: isHome ? "none" : "auto" }}
      >
        ⤾ Vue globale
      </button>
    </div>
  );
}
