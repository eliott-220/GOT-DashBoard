import "./AmbientLayer.css";

// Purely decorative, screen-space atmosphere sitting in front of the map:
// drifting haze, a slow light sweep, and the occasional bird. None of it
// tracks map coordinates or reacts to the camera — it's meant to read as
// "the air above the world", not as part of the terrain.
const CLOUDS = [
  { top: "4%", size: 420, duration: 95, delay: -10, opacity: 0.09 },
  { top: "14%", size: 300, duration: 130, delay: -60, opacity: 0.07 },
  { top: "26%", size: 520, duration: 160, delay: -30, opacity: 0.06 },
  { top: "8%", size: 260, duration: 110, delay: -85, opacity: 0.08 },
];

const BIRDS = [
  { top: "18%", duration: 42, delay: -6 },
  { top: "30%", duration: 55, delay: -34 },
];

export default function AmbientLayer() {
  return (
    <div className="ambient-layer" aria-hidden="true">
      <div className="ambient-light-sweep" />
      {CLOUDS.map((cloud, i) => (
        <div
          key={i}
          className="ambient-cloud"
          style={{
            top: cloud.top,
            width: cloud.size,
            height: cloud.size * 0.4,
            opacity: cloud.opacity,
            animationDuration: `${cloud.duration}s`,
            animationDelay: `${cloud.delay}s`,
          }}
        />
      ))}
      {BIRDS.map((bird, i) => (
        <svg
          key={i}
          className="ambient-bird"
          style={{ top: bird.top, animationDuration: `${bird.duration}s`, animationDelay: `${bird.delay}s` }}
          viewBox="0 0 16 8"
          width="16"
          height="8"
        >
          <path d="M0 4 Q4 0 8 4 Q12 0 16 4" stroke="rgba(30,26,20,0.55)" strokeWidth="1" fill="none" />
        </svg>
      ))}
    </div>
  );
}
