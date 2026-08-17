import type { Castle } from "../data/castles";
import "./CastleHotspot.css";

interface CastleHotspotProps {
  castle: Castle;
}

export default function CastleHotspot({ castle }: CastleHotspotProps) {
  return (
    <button
      type="button"
      className="castle-hotspot"
      style={{ left: `${castle.position.xPct}%`, top: `${castle.position.yPct}%` }}
      aria-label={castle.name}
    >
      <span className="castle-hotspot-glow" />
      <span className="castle-hotspot-label">{castle.name}</span>
    </button>
  );
}
