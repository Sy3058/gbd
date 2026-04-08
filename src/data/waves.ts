import type { WaveConfig } from "../types";

export const WAVES: WaveConfig[] = [
  {
    wave: 1,
    commitCount: 5,
    speed: 0.025,
    spawnInterval: 3500,
    branches: ["main"],
    itemDropRate: 0,
  },
  {
    wave: 2,
    commitCount: 8,
    speed: 0.035,
    spawnInterval: 2800,
    branches: ["main", "feature"],
    itemDropRate: 0.15,
  },
  {
    wave: 3,
    commitCount: 12,
    speed: 0.045,
    spawnInterval: 2200,
    branches: ["main", "feature", "hotfix"],
    itemDropRate: 0.25,
  },
];

export const TOTAL_COMMITS = WAVES.reduce((sum, w) => sum + w.commitCount, 0);
