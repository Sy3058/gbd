import type { WaveConfig } from "../types";

export const WAVES: WaveConfig[] = [
  {
    wave: 1,
    commitCount: 3,
    speed: 0.025,
    spawnInterval: 3500,
    branches: ["main"],
    itemDropRate: 0,
  },
  {
    wave: 2,
    commitCount: 4,
    speed: 0.05,
    spawnInterval: 2800,
    branches: ["main", "feature"],
    itemDropRate: 0.15,
  },
  {
    wave: 3,
    commitCount: 4,
    speed: 0.075,
    spawnInterval: 2200,
    branches: ["main", "feature", "hotfix"],
    itemDropRate: 0.25,
  },
];

export const TOTAL_COMMITS = WAVES.reduce((sum, w) => sum + w.commitCount, 0);

// 튜토리얼 전용 웨이브: 느리고 단순
export const TUTORIAL_WAVES: WaveConfig[] = [
  {
    wave: 1,
    commitCount: 3,
    speed: 0.015,
    spawnInterval: 5000,
    branches: ["main"],
    itemDropRate: 0,
    mergeRate: 0,
  },
  {
    wave: 2,
    commitCount: 5,
    speed: 0.015,
    spawnInterval: 4500,
    branches: ["main", "feature"],
    itemDropRate: 0,
    mergeRate: 0.4,
  },
];

export const TUTORIAL_TOTAL_COMMITS = TUTORIAL_WAVES.reduce(
  (sum, w) => sum + w.commitCount,
  0,
);
