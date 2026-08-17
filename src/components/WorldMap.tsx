import mapImage from "../../assets/map/world-map-base.png";
import "./WorldMap.css";

// Natural pixel dimensions of the base map asset, used to preserve its
// aspect ratio while the viewport is scaled to fit.
const MAP_WIDTH = 1055;
const MAP_HEIGHT = 1024;

export default function WorldMap() {
  return (
    <div className="world-map-viewport">
      <div
        className="world-map-stage"
        style={{ aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}
      >
        <img
          className="world-map-image"
          src={mapImage}
          alt="Carte du royaume"
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          draggable={false}
        />
      </div>
    </div>
  );
}
