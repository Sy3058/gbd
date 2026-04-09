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
import { generateWaveCommits, resetIdCounter } from "../engine/waveGenerator";
import { parseGitCommand } from "../engine/commandParser";

interface GameStore {
  // 게임 상태
  gameState: GameState;
  gameMode: GameMode;
  hearts: number;
  deployPercent: number;
  deployPerCommit: number;
  timer: number;
  combo: number;
  maxCombo: number;
  missCount: number;
  wrongCount: number; // 잘못된 명령어 입력 횟수

  // 브랜치
  currentBranch: BranchName;
  activeBranches: BranchName[];
  branchOrigins: Record<string, number>;
  branchMergePoints: Record<string, number>;

  // 커밋
  activeCommit: CommitNode | null;
  fixedCommits: CommitNode[];
  commitQueue: CommitNode[];
  processedCount: number;

  // 웨이브
  currentWave: number;

  // 아이템
  items: Item[];

  // 입력
  input: string;

  // 타이머 관련
  lastSpawnTime: number;
  gameStartTime: number;
  lastTickTime: number;

  // 액션
  startGame: (mode: GameMode) => void;
  tick: (now: number) => void;
  setInput: (input: string) => void;
  appendInput: (char: string) => void;
  backspace: () => void;
  submitCommand: () => void;
  useItem: (itemType: ItemType) => void;
  reset: () => void;
  advanceWaveOrEnd: () => void;
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
  // 초기 상태
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
  currentBranch: "main",
  activeBranches: ["main"],
  branchOrigins: {},
  branchMergePoints: {},
  activeCommit: null,
  fixedCommits: [],
  commitQueue: [],
  processedCount: 0,
  currentWave: 0,
  items: [],
  input: "",
  lastSpawnTime: 0,
  gameStartTime: 0,
  lastTickTime: 0,

  startGame: (mode: GameMode) => {
    resetIdCounter();
    const waves = mode === "tutorial" ? TUTORIAL_WAVES : WAVES;
    const totalCommits =
      mode === "tutorial" ? TUTORIAL_TOTAL_COMMITS : TOTAL_COMMITS;
    const firstWave = generateWaveCommits(waves[0]);
    const [first, ...rest] = firstWave;

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
      currentBranch: "main",
      activeBranches: ["main"],
      branchOrigins: {},
      branchMergePoints: {},
      activeCommit: first ? { ...first, y: 0 } : null,
      fixedCommits: [],
      commitQueue: rest,
      processedCount: 0,
      currentWave: 0,
      items: [],
      input: "",
      lastSpawnTime: performance.now(),
      gameStartTime: performance.now(),
      lastTickTime: performance.now(),
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
    for (const key in branchOrigins) {
      branchOrigins[key] += currentWorldSpeed * (deltaTime / 16.67);
    }

    const branchMergePoints = { ...state.branchMergePoints };
    for (const key in branchMergePoints) {
      branchMergePoints[key] += currentWorldSpeed * (deltaTime / 16.67);
    }

    if (state.activeCommit) {
      const moveAmount = state.activeCommit.speed * (deltaTime / 16.67);
      const newY = state.activeCommit.y + moveAmount;

      if (newY > 95) {
        // 바닥 도달 → 미스
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

        if (!next) {
          get().advanceWaveOrEnd();
        }
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
    const newBranches = nextWave.branches.filter(
      (b) => !state.activeBranches.includes(b),
    );

    const newCommits = generateWaveCommits(nextWave);

    // checkout -b 직후 첫 커밋은 반드시 새 브랜치 것이어야 함
    if (newBranches.length > 0) {
      const targetBranch = newBranches[0];
      const firstNewIdx = newCommits.findIndex((c) =>
        newBranches.includes(c.targetBranch),
      );
      if (firstNewIdx > 0) {
        // 새 브랜치 커밋을 맨 앞으로 스왑
        [newCommits[0], newCommits[firstNewIdx]] = [
          newCommits[firstNewIdx],
          newCommits[0],
        ];
      } else if (firstNewIdx === -1) {
        // 새 브랜치 커밋이 없으면 첫 번째를 강제 변경
        newCommits[0] = { ...newCommits[0], targetBranch };
      }
    }

    const [first, ...rest] = newCommits;

    if (newBranches.length > 0) {
      // 새 브랜치 등장 → BRANCH_INTRO 팝업
      set({
        gameState: "BRANCH_INTRO",
        currentWave: nextWaveIndex,
        activeBranches: [...state.activeBranches, ...newBranches],
        activeCommit: first ? { ...first, y: 40 } : null,
        commitQueue: rest,
      });
    } else {
      set({
        currentWave: nextWaveIndex,
        activeCommit: first ? { ...first, y: 0 } : null,
        commitQueue: rest,
        lastSpawnTime: performance.now(),
      });
    }
  },

  setInput: (input) => set({ input }),
  appendInput: (char) => set((s) => ({ input: s.input + char })),
  backspace: () => set((s) => ({ input: s.input.slice(0, -1) })),

  submitCommand: () => {
    const state = get();
    const parsed = parseGitCommand(state.input);

    switch (parsed.type) {
      case "CHECKOUT_NEW": {
        // BRANCH_INTRO 중에만 유효: 새 브랜치 생성 + 이동
        if (
          state.gameState === "BRANCH_INTRO" &&
          state.activeBranches.includes(parsed.branch)
        ) {
          set({
            currentBranch: parsed.branch,
            gameState: "PLAYING",
            activeCommit: state.activeCommit
              ? { ...state.activeCommit, y: 0 }
              : null,
            lastSpawnTime: performance.now(),
            lastTickTime: performance.now(),
            input: "",
          });
        }
        break;
      }

      case "CHECKOUT": {
        // PLAYING 중 기존 브랜치로 이동
        if (
          state.gameState === "PLAYING" &&
          state.activeBranches.includes(parsed.branch)
        ) {
          set({ currentBranch: parsed.branch, input: "" });
        }
        break;
      }

      case "COMMIT":
      case "MERGE": {
        if (state.gameState !== "PLAYING" || !state.activeCommit) break;

        if (
          state.input.trim() === state.activeCommit.text &&
          state.currentBranch === state.activeCommit.targetBranch
        ) {
          const newCombo = state.combo + 1;
          const newMaxCombo = Math.max(state.maxCombo, newCombo);
          const newDeployPercent = Math.min(
            100,
            state.deployPercent + state.deployPerCommit,
          );
          const newProcessed = state.processedCount + 1;

          const branchOrigins = { ...state.branchOrigins };
          const branchMergePoints = { ...state.branchMergePoints };
          const commit = state.activeCommit;

          // 새 브랜치의 첫 커밋 → 분기점 기록 (undefined 체크로 y=0 케이스도 정확히 처리)
          if (
            commit.targetBranch !== "main" &&
            branchOrigins[commit.targetBranch] === undefined
          ) {
            branchOrigins[commit.targetBranch] = commit.y;
          }

          // merge 커밋 → 해당 브랜치의 머지 지점 기록
          // branchOrigins가 먼저 설정된 경우에만 (분기 없는 머지 방지)
          if (
            parsed.type === "MERGE" &&
            branchOrigins[commit.targetBranch] !== undefined
          ) {
            branchMergePoints[commit.targetBranch] = commit.y;
          }

          const items = [...state.items];
          if (
            commit.type === "item" &&
            commit.itemDrop &&
            items.length < MAX_ITEMS
          ) {
            items.push(ITEM_DEFINITIONS[commit.itemDrop]);
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
            });
            break;
          }

          const [next, ...remaining] = state.commitQueue;
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
            lastSpawnTime: performance.now(),
          });

          if (!next) {
            setTimeout(() => get().advanceWaveOrEnd(), 500);
          }
        } else {
          // 틀린 명령 → 콤보 초기화 + 오타 카운트
          set({ combo: 0, wrongCount: state.wrongCount + 1 });
        }
        break;
      }

      case "ITEM_USE": {
        const itemIndex = state.items.findIndex((i) => i.type === parsed.item);
        if (itemIndex === -1) break;

        const newItems = [...state.items];
        newItems.splice(itemIndex, 1);

        switch (parsed.item) {
          case "stash":
            if (state.activeCommit) {
              const originalSpeed = state.activeCommit.speed;
              set({
                activeCommit: { ...state.activeCommit, speed: 0 },
                items: newItems,
              });
              setTimeout(() => {
                const current = get().activeCommit;
                if (current) {
                  set({ activeCommit: { ...current, speed: originalSpeed } });
                }
              }, 3000);
            }
            break;
          case "rebase":
            if (state.activeCommit) {
              set({
                activeCommit: {
                  ...state.activeCommit,
                  speed: state.activeCommit.speed * 0.5,
                },
                items: newItems,
              });
            }
            break;
          case "heal":
            set({
              hearts: Math.min(INITIAL_HEARTS, state.hearts + 1),
              items: newItems,
            });
            break;
        }
        break;
      }

      default: {
        // 인식 불가 명령어(오타) → 콤보 초기화 + 오타 카운트
        if (state.gameState === "PLAYING" && state.activeCommit) {
          set({ combo: 0, wrongCount: state.wrongCount + 1 });
        }
        break;
      }
    }

    set({ input: "" });
  },

  useItem: (itemType: ItemType) => {
    const state = get();
    const itemIndex = state.items.findIndex((i) => i.type === itemType);
    if (itemIndex === -1) return;
    set({ input: `git ${itemType}` });
    get().submitCommand();
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
      currentBranch: "main",
      activeBranches: ["main"],
      branchOrigins: {},
      branchMergePoints: {},
      activeCommit: null,
      fixedCommits: [],
      commitQueue: [],
      processedCount: 0,
      currentWave: 0,
      items: [],
      input: "",
    });
  },
}));
