import { create } from "zustand";
import type {
  GameState,
  GameMode,
  BranchName,
  CommitNode,
  Item,
  ItemType,
} from "../types";
import {
  WAVES,
  TOTAL_COMMITS,
  TUTORIAL_WAVES,
  TUTORIAL_TOTAL_COMMITS,
} from "../data/waves";
import {
  generateWaveCommits,
  resetIdCounter,
  generateCheckoutNode,
} from "../engine/waveGenerator";
import { parseGitCommand } from "../engine/commandParser";

interface GameStore {
  gameState: GameState;
  gameMode: GameMode;
  hearts: number;
  deployPercent: number;
  deployPerCommit: number;
  timer: number;
  combo: number;
  maxCombo: number;
  missCount: number;
  wrongCount: number;
  waveAnnouncement: number | null;
  lastAcquiredItem: Item | null;

  currentBranch: BranchName;
  activeBranches: BranchName[];
  branchOrigins: Record<string, number>;
  branchMergePoints: Record<string, number>;
  branchParents: Record<string, string>;

  activeCommit: CommitNode | null;
  fixedCommits: CommitNode[];
  commitQueue: CommitNode[];
  processedCount: number;

  currentWave: number;
  items: Item[];
  input: string;
  hasSeenItemTutorial: boolean;

  lastSpawnTime: number;
  gameStartTime: number;
  lastTickTime: number;

  startGame: (mode: GameMode) => void;
  tick: (now: number) => void;
  setInput: (input: string) => void;
  appendInput: (char: string) => void;
  backspace: () => void;
  submitCommand: () => void;
  activateItem: (itemType: ItemType) => void; // 🔥 useItem에서 이름 변경
  reset: () => void;
  advanceWaveOrEnd: () => void;
  closeItemTutorial: () => void;
}

const INITIAL_HEARTS = 3;
const MAX_ITEMS = 3;

const ITEM_DEFINITIONS: Record<ItemType, Item> = {
  stash: {
    type: "stash",
    name: "git stash",
    description: "현재 커밋을 3초간 일시정지",
  },
  rebase: {
    type: "rebase",
    name: "git rebase",
    description: "현재 커밋 속도 50% 감소",
  },
  heal: { type: "heal", name: "heal", description: "하트 1개 회복" },
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: "START",
  gameMode: "single",
  hearts: INITIAL_HEARTS,
  deployPercent: 0,
  deployPerCommit: 100 / TOTAL_COMMITS,
  timer: 0,
  combo: 0,
  maxCombo: 0,
  missCount: 0,
  wrongCount: 0,
  waveAnnouncement: null,
  lastAcquiredItem: null,
  currentBranch: "main",
  activeBranches: ["main"],
  branchOrigins: {},
  branchMergePoints: {},
  branchParents: {},
  activeCommit: null,
  fixedCommits: [],
  commitQueue: [],
  processedCount: 0,
  currentWave: 0,
  items: [],
  input: "",
  hasSeenItemTutorial: false,
  lastSpawnTime: 0,
  gameStartTime: 0,
  lastTickTime: 0,

  startGame: (mode: GameMode) => {
    resetIdCounter();
    const waves = mode === "tutorial" ? TUTORIAL_WAVES : WAVES;
    const totalCommits =
      mode === "tutorial" ? TUTORIAL_TOTAL_COMMITS : TOTAL_COMMITS;
    const firstWave = generateWaveCommits(waves[0], []);
    const [first, ...rest] = firstWave;
    const now = performance.now();

    set({
      gameState: "PLAYING",
      gameMode: mode,
      hearts: INITIAL_HEARTS,
      deployPercent: 0,
      deployPerCommit: 100 / totalCommits,
      timer: 0,
      combo: 0,
      maxCombo: 0,
      missCount: 0,
      wrongCount: 0,
      waveAnnouncement: null,
      lastAcquiredItem: null,
      currentBranch: "main",
      activeBranches: ["main"],
      branchOrigins: {},
      branchMergePoints: {},
      branchParents: {},
      activeCommit: first ? { ...first, y: 0 } : null,
      fixedCommits: [],
      commitQueue: rest,
      processedCount: 0,
      currentWave: 0,
      items: [],
      input: "",
      hasSeenItemTutorial: false,
      lastSpawnTime: now,
      gameStartTime: now,
      lastTickTime: now,
    });
  },

  tick: (now: number) => {
    const state = get();
    if (state.gameState !== "PLAYING") return;

    const lastTickTime = state.lastTickTime || now;
    const deltaTime = now - lastTickTime;
    const waves = state.gameMode === "tutorial" ? TUTORIAL_WAVES : WAVES;
    const currentWaveConfig = waves[state.currentWave];
    const currentWorldSpeed = currentWaveConfig.speed;
    const timer = now - state.gameStartTime;

    const fixedCommits = state.fixedCommits
      .map((c) => ({ ...c, y: c.y + currentWorldSpeed * (deltaTime / 16.67) }))
      .filter((c) => c.y < 120);
    const branchOrigins = { ...state.branchOrigins };
    for (const key in branchOrigins)
      branchOrigins[key] += currentWorldSpeed * (deltaTime / 16.67);
    const branchMergePoints = { ...state.branchMergePoints };
    for (const key in branchMergePoints)
      branchMergePoints[key] += currentWorldSpeed * (deltaTime / 16.67);

    if (state.activeCommit) {
      const moveAmount = state.activeCommit.speed * (deltaTime / 16.67);
      const newY = state.activeCommit.y + moveAmount;

      if (newY > 95) {
        const newHearts = state.hearts - 1;
        const newMissCount = state.missCount + 1;
        if (newHearts <= 0) {
          set({
            gameState: "GAMEOVER",
            hearts: 0,
            timer,
            missCount: newMissCount,
            lastTickTime: now,
          });
          return;
        }
        const [next, ...remaining] = state.commitQueue;
        set({
          hearts: newHearts,
          combo: 0,
          missCount: newMissCount,
          activeCommit: next ? { ...next, y: 0 } : null,
          commitQueue: remaining,
          fixedCommits,
          branchOrigins,
          branchMergePoints,
          timer,
          lastTickTime: now,
        });
        if (!next) get().advanceWaveOrEnd();
        return;
      } else {
        set({
          activeCommit: { ...state.activeCommit, y: newY },
          fixedCommits,
          branchOrigins,
          branchMergePoints,
          timer,
          lastTickTime: now,
        });
      }
    } else {
      const timeSinceLastSpawn = now - state.lastSpawnTime;
      if (
        state.commitQueue.length > 0 &&
        timeSinceLastSpawn > (currentWaveConfig?.spawnInterval ?? 2000)
      ) {
        const [next, ...remaining] = state.commitQueue;
        set({
          activeCommit: { ...next, y: 0 },
          commitQueue: remaining,
          lastSpawnTime: now,
          fixedCommits,
          branchOrigins,
          branchMergePoints,
          timer,
          lastTickTime: now,
        });
      } else {
        set({
          fixedCommits,
          branchOrigins,
          branchMergePoints,
          timer,
          lastTickTime: now,
        });
      }
    }
  },

  advanceWaveOrEnd: () => {
    const state = get();
    const waves = state.gameMode === "tutorial" ? TUTORIAL_WAVES : WAVES;
    const nextWaveIndex = state.currentWave + 1;

    if (nextWaveIndex >= waves.length) {
      set({ gameState: "SUCCESS" });
      return;
    }

    const nextWave = waves[nextWaveIndex];
    const mergedBranches = Object.keys(state.branchMergePoints);
    const newBranches = nextWave.branches.filter(
      (b) => !state.activeBranches.includes(b) && !mergedBranches.includes(b),
    );
    const newCommits = generateWaveCommits(nextWave, mergedBranches);

    if (newBranches.length > 0) {
      if (state.gameMode === "single") {
        let aliveBranches = state.activeBranches.filter(
          (b) => !mergedBranches.includes(b),
        );
        if (aliveBranches.length === 0) aliveBranches = ["main"];

        const checkoutNodes = newBranches.map((b) => {
          const randomSource =
            aliveBranches[Math.floor(Math.random() * aliveBranches.length)];
          return generateCheckoutNode(b, randomSource, nextWave.speed);
        });
        newCommits.unshift(...checkoutNodes);
      } else {
        const targetBranch = newBranches[0];
        const firstNewIdx = newCommits.findIndex((c) =>
          newBranches.includes(c.targetBranch),
        );
        if (firstNewIdx > 0)
          [newCommits[0], newCommits[firstNewIdx]] = [
            newCommits[firstNewIdx],
            newCommits[0],
          ];
        else if (firstNewIdx === -1)
          newCommits[0] = { ...newCommits[0], targetBranch };
      }
    }

    const [first, ...rest] = newCommits;
    const waveNumber = nextWaveIndex + 1;

    if (state.gameMode === "single") {
      set({
        gameState: "WAVE_TRANSITION",
        currentWave: nextWaveIndex,
        activeBranches: [...state.activeBranches, ...newBranches],
        activeCommit: first ? { ...first, y: 0 } : null,
        commitQueue: rest,
        waveAnnouncement: waveNumber,
      });
      setTimeout(() => {
        if (get().gameState === "WAVE_TRANSITION") {
          const now = performance.now();
          set({
            gameState: "PLAYING",
            waveAnnouncement: null,
            lastSpawnTime: now,
            lastTickTime: now,
          });
        }
      }, 1200);
    } else if (newBranches.length > 0) {
      set({
        gameState: "BRANCH_INTRO",
        currentWave: nextWaveIndex,
        activeBranches: [...state.activeBranches, ...newBranches],
        activeCommit: first ? { ...first, y: 40 } : null,
        commitQueue: rest,
      });
    } else {
      const now = performance.now();
      set({
        currentWave: nextWaveIndex,
        activeCommit: first ? { ...first, y: 0 } : null,
        commitQueue: rest,
        lastSpawnTime: now,
        lastTickTime: now,
      });
    }
  },

  setInput: (input) => set({ input }),
  appendInput: (char) => set((s) => ({ input: s.input + char })),
  backspace: () => set((s) => ({ input: s.input.slice(0, -1) })),

  submitCommand: () => {
    const state = get();
    const parsed = parseGitCommand(state.input);
    const inputTrimmed = state.input.trim();

    if (inputTrimmed === "") {
      set({ input: "" });
      return;
    }

    if (["1", "2", "3"].includes(inputTrimmed)) {
      const index = parseInt(inputTrimmed) - 1;
      const item = state.items[index];

      // 해당 슬롯에 아이템이 존재할 때만 발동
      if (item) {
        get().activateItem(item.type);
      }

      // 아이템이 있든 없든 1,2,3 단독 입력은 무조건 터미널을 비우고 종료 (오타 판정 방지)
      set({ input: "" });
      return;
    }

    const isNodeMatch =
      state.gameState === "PLAYING" &&
      state.activeCommit &&
      inputTrimmed === state.activeCommit.text &&
      state.currentBranch === state.activeCommit.targetBranch;

    if (isNodeMatch) {
      const commit = state.activeCommit!;
      const newCombo = state.combo + 1;
      const newMaxCombo = Math.max(state.maxCombo, newCombo);
      const newDeployPercent = Math.min(
        100,
        state.deployPercent + state.deployPerCommit,
      );
      const newProcessed = state.processedCount + 1;

      const branchOrigins = { ...state.branchOrigins };
      const branchMergePoints = { ...state.branchMergePoints };
      let nextBranch = state.currentBranch;

      if (parsed.type === "CHECKOUT_NEW") {
        nextBranch = parsed.branch;
        if (branchOrigins[parsed.branch] === undefined) {
          branchOrigins[parsed.branch] = commit.y;
          const branchParents = { ...state.branchParents };
          branchParents[parsed.branch] = commit.targetBranch;
          set({ branchParents });
        }
      } else if (
        commit.targetBranch !== "main" &&
        branchOrigins[commit.targetBranch] === undefined
      ) {
        branchOrigins[commit.targetBranch] = commit.y;
      }

      if (
        parsed.type === "MERGE" &&
        branchOrigins[commit.targetBranch] !== undefined
      ) {
        branchMergePoints[commit.targetBranch] = commit.y;
      }

      const items = [...state.items];
      let shouldShowItemTutorial = false;

      if (
        commit.type === "item" &&
        commit.itemDrop &&
        items.length < MAX_ITEMS
      ) {
        items.push(ITEM_DEFINITIONS[commit.itemDrop]);
        if (state.gameMode === "tutorial" && !state.hasSeenItemTutorial) {
          shouldShowItemTutorial = true;
        }
      }

      const fixedCommits = [
        ...state.fixedCommits,
        { ...commit, isFixed: true },
      ];

      if (newDeployPercent >= 100) {
        set({
          gameState: "SUCCESS",
          deployPercent: 100,
          combo: newCombo,
          maxCombo: newMaxCombo,
          activeCommit: null,
          fixedCommits,
          branchOrigins,
          branchMergePoints,
          items,
          processedCount: newProcessed,
          currentBranch: nextBranch,
          input: "",
        });
        return;
      }

      const [next, ...remaining] = state.commitQueue;
      const now = performance.now();

      if (shouldShowItemTutorial) {
        set({
          gameState: "ITEM_INTRO",
          hasSeenItemTutorial: true,
          combo: newCombo,
          maxCombo: newMaxCombo,
          deployPercent: newDeployPercent,
          activeCommit: next ? { ...next, y: 0 } : null,
          commitQueue: remaining,
          fixedCommits,
          branchOrigins,
          branchMergePoints,
          items,
          processedCount: newProcessed,
          currentBranch: nextBranch,
          input: "",
        });
        return;
      }

      set({
        combo: newCombo,
        maxCombo: newMaxCombo,
        deployPercent: newDeployPercent,
        activeCommit: next ? { ...next, y: 0 } : null,
        commitQueue: remaining,
        fixedCommits,
        branchOrigins,
        branchMergePoints,
        items,
        processedCount: newProcessed,
        lastSpawnTime: now,
        lastTickTime: now,
        currentBranch: nextBranch,
        input: "",
      });

      if (!next) setTimeout(() => get().advanceWaveOrEnd(), 500);
      return;
    }

    switch (parsed.type) {
      case "CHECKOUT_NEW": {
        if (!state.activeBranches.includes(parsed.branch)) break;
        const branchOrigins = { ...state.branchOrigins };

        if (state.gameState === "BRANCH_INTRO") {
          if (branchOrigins[parsed.branch] === undefined) {
            branchOrigins[parsed.branch] = state.activeCommit
              ? state.activeCommit.y
              : 0;
          }
          set({
            currentBranch: parsed.branch,
            gameState: "PLAYING",
            waveAnnouncement: null,
            activeCommit: state.activeCommit
              ? { ...state.activeCommit, y: 0 }
              : null,
            lastSpawnTime: performance.now(),
            lastTickTime: performance.now(),
            branchOrigins,
            input: "",
          });
          return;
        } else if (state.gameState === "PLAYING") {
          if (branchOrigins[parsed.branch] === undefined) {
            branchOrigins[parsed.branch] = state.activeCommit
              ? state.activeCommit.y
              : 0;
          }
          set({ currentBranch: parsed.branch, branchOrigins, input: "" });
          return;
        }
        break;
      }

      case "CHECKOUT": {
        if (
          state.gameState === "PLAYING" &&
          state.activeBranches.includes(parsed.branch)
        ) {
          set({ currentBranch: parsed.branch, input: "" });
          return;
        }
        break;
      }

      case "COMMIT":
      case "MERGE":
        break;

      case "ITEM_USE": {
        const itemIndex = state.items.findIndex((i) => i.type === parsed.item);
        if (itemIndex === -1) break;

        const newItems = [...state.items];
        newItems.splice(itemIndex, 1);

        if (parsed.item === "stash" && state.activeCommit) {
          const originalSpeed = state.activeCommit.speed;
          set({
            activeCommit: { ...state.activeCommit, speed: 0 },
            items: newItems,
            input: "",
          });
          setTimeout(() => {
            const current = get().activeCommit;
            if (current)
              set({ activeCommit: { ...current, speed: originalSpeed } });
          }, 3000);
          return;
        } else if (parsed.item === "rebase" && state.activeCommit) {
          set({
            activeCommit: {
              ...state.activeCommit,
              speed: state.activeCommit.speed * 0.5,
            },
            items: newItems,
            input: "",
          });
          return;
        } else if (parsed.item === "heal") {
          set({
            hearts: Math.min(3, state.hearts + 1),
            items: newItems,
            input: "",
          });
          return;
        }
        break;
      }
    }

    if (state.gameState === "PLAYING" && state.activeCommit) {
      set({ combo: 0, wrongCount: state.wrongCount + 1, input: "" });
    } else {
      set({ input: "" });
    }
  },

  // 🔥 이름 변경 및 인자 타입 유지: 파서 우회, 즉시 상태 조작
  activateItem: (itemType: ItemType) => {
    const state = get();
    if (state.gameState !== "PLAYING") return;

    const itemIndex = state.items.findIndex((i) => i.type === itemType);
    if (itemIndex === -1) return;

    const newItems = [...state.items];
    newItems.splice(itemIndex, 1);

    if (itemType === "stash" && state.activeCommit) {
      const originalSpeed = state.activeCommit.speed;
      set({
        activeCommit: { ...state.activeCommit, speed: 0 },
        items: newItems,
      });
      setTimeout(() => {
        const current = get().activeCommit;
        if (current)
          set({ activeCommit: { ...current, speed: originalSpeed } });
      }, 3000);
    } else if (itemType === "rebase" && state.activeCommit) {
      set({
        activeCommit: {
          ...state.activeCommit,
          speed: state.activeCommit.speed * 0.5,
        },
        items: newItems,
      });
    } else if (itemType === "heal") {
      set({ hearts: Math.min(3, state.hearts + 1), items: newItems });
    }
  },

  closeItemTutorial: () => {
    const now = performance.now();
    set({ gameState: "PLAYING", lastSpawnTime: now, lastTickTime: now });
  },

  reset: () => {
    set({
      gameState: "START",
      gameMode: "single",
      hearts: INITIAL_HEARTS,
      deployPercent: 0,
      deployPerCommit: 100 / TOTAL_COMMITS,
      timer: 0,
      combo: 0,
      maxCombo: 0,
      missCount: 0,
      wrongCount: 0,
      waveAnnouncement: null,
      currentBranch: "main",
      activeBranches: ["main"],
      branchOrigins: {},
      branchMergePoints: {},
      branchParents: {},
      activeCommit: null,
      fixedCommits: [],
      commitQueue: [],
      processedCount: 0,
      currentWave: 0,
      items: [],
      input: "",
      hasSeenItemTutorial: false,
    });
  },
}));
