import type { MouseEvent as ReactMouseEvent } from "react";
import type { Castle } from "../data/castles";
import "./CastleHotspot.css";

interface CastleHotspotProps {
  castle: Castle;
  onSelect: (castle: Castle, element: HTMLButtonElement) => void;
}

export default function CastleHotspot({ castle, onSelect }: CastleHotspotProps) {
  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    onSelect(castle, event.currentTarget);
  };

  return (
    <button
      type="button"
      className="castle-hotspot"
      style={{ left: `${castle.position.xPct}%`, top: `${castle.position.yPct}%` }}
      aria-label={castle.name}
      onClick={handleClick}
    >
      <span className="castle-hotspot-glow" />
      <span className="castle-hotspot-label">{castle.name}</span>
    </button>
  );
}
