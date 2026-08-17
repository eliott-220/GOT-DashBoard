export type CastleStatus = "idle" | "active" | "alert" | "completed";

export interface Castle {
  id: string;
  name: string;
  /** Position as a percentage of the base map image, so it stays correct at any scale. */
  position: { xPct: number; yPct: number };
  status: CastleStatus;
  agents: string[];
  activity: number;
}

// Positions are calibrated against assets/map/world-map-base.png (1055x1024).
// Status/agents/activity are neutral placeholders until each castle is wired
// to a real agent group.
export const castles: Castle[] = [
  { id: "winterfell", name: "Winterfell", position: { xPct: 49.0, yPct: 21.5 }, status: "idle", agents: [], activity: 0 },
  { id: "les-eyrie", name: "Les Eyrié", position: { xPct: 69.5, yPct: 34.5 }, status: "idle", agents: [], activity: 0 },
  { id: "viveaigue", name: "Viveaigue", position: { xPct: 43.8, yPct: 39.0 }, status: "idle", agents: [], activity: 0 },
  { id: "harrenhal", name: "Harrenhal", position: { xPct: 51.5, yPct: 44.5 }, status: "idle", agents: [], activity: 0 },
  { id: "castral-roc", name: "Castral Roc", position: { xPct: 24.8, yPct: 49.5 }, status: "idle", agents: [], activity: 0 },
  { id: "port-real", name: "Port-Réal", position: { xPct: 60.5, yPct: 53.0 }, status: "idle", agents: [], activity: 0 },
  { id: "accalmie", name: "Accalmie", position: { xPct: 71.5, yPct: 56.5 }, status: "idle", agents: [], activity: 0 },
  { id: "peyredragon", name: "Peyredragon", position: { xPct: 89.5, yPct: 27.0 }, status: "idle", agents: [], activity: 0 },
  { id: "hautjardin", name: "Hautjardin", position: { xPct: 39.8, yPct: 63.0 }, status: "idle", agents: [], activity: 0 },
  { id: "lancehelion", name: "Lancehélion", position: { xPct: 75.8, yPct: 74.0 }, status: "idle", agents: [], activity: 0 },
];
