import { create } from "zustand";
import type {
  GameState,
  BranchName,
  CommitNode,
  Item,
  ItemType,
} from "../types";
import { WAVES, TOTAL_COMMITS } from "../data/waves";
import { generateWaveCommits, resetIdCounter } from "../engine/waveGenerator";
import { parseGitCommand } from "../engine/commandParser";

interface GameStore {
  // 게임 상태
  gameState: GameState;
  hearts: number;
  deployPercent: number;
  timer: number;
  combo: number;
  maxCombo: number;
  missCount: number;

  // 브랜치
  currentBranch: BranchName;
  activeBranches: BranchName[];
  branchOrigins: Record<string, number>; // 브랜치별 분기 Y 좌표
  branchMergePoints: Record<string, number>; // 브랜치별 머지 Y 좌표

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
  startGame: () => void;
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
const WORLD_SPEED = 0.02; // 기본 낙하 속도
const MAX_ITEMS = 3;
const DEPLOY_PER_COMMIT = 100 / TOTAL_COMMITS;

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

// function calculateGrade(
//   clearTime: number,
//   maxCombo: number,
//   missCount: number,
// ): Grade {
//   const score = maxCombo * 100 - missCount * 200 - clearTime / 1000;
//   if (score > 800) return "S";
//   if (score > 500) return "A";
//   if (score > 200) return "B";
//   if (score > 0) return "C";
//   return "D";
// }

export const useGameStore = create<GameStore>((set, get) => ({
  // 초기 상태
  gameState: "START",
  hearts: INITIAL_HEARTS,
  deployPercent: 0,
  timer: 0,
  combo: 0,
  maxCombo: 0,
  missCount: 0,
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

  startGame: () => {
    resetIdCounter();
    const firstWave = generateWaveCommits(WAVES[0]);
    const [first, ...rest] = firstWave;

    set({
      gameState: "PLAYING",
      hearts: INITIAL_HEARTS,
      deployPercent: 0,
      timer: 0,
      combo: 0,
      maxCombo: 0,
      missCount: 0,
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

    const currentWaveConfig = WAVES[state.currentWave];
    const currentWorldSpeed = currentWaveConfig.speed;

    // (선택) 만약 git rebase 등으로 게임 전체를 느리게 하는 timeScale이 있다면 여기서 곱해줍니다.
    // const finalWorldSpeed = currentWorldSpeed * (state.timeScale || 1);

    const timer = now - state.gameStartTime;

    // 고정 커밋 및 배경 이동에 currentWorldSpeed 적용
    const fixedCommits = state.fixedCommits
      .map((c) => ({ ...c, y: c.y + currentWorldSpeed * (deltaTime / 16.67) }))
      .filter((c) => c.y < 120);

    const branchOrigins = { ...state.branchOrigins };
    for (const key in branchOrigins) {
      branchOrigins[key] += currentWorldSpeed * (deltaTime / 16.67);
    }

    const branchMergePoints = { ...state.branchMergePoints };
    for (const key in branchMergePoints) {
      branchMergePoints[key] += WORLD_SPEED * (deltaTime / 16.67);
    }

    // 활성 커밋 이동
    if (state.activeCommit) {
      const moveAmount = state.activeCommit.speed * (deltaTime / 16.67);
      const newY = state.activeCommit.y + moveAmount;

      // 바닥 도달 → 미스
      if (newY > 95) {
        const newHearts = state.hearts - 1;
        const newMissCount = state.missCount + 1;

        if (newHearts <= 0) {
          set({
            gameState: "GAMEOVER",
            hearts: 0,
            timer,
            missCount: newMissCount,
          });
          return;
        }

        // 다음 커밋 스폰
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
        });

        // 큐가 비었고 활성 커밋도 없으면 다음 웨이브
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
          lastTickTime: now, // 틱 완료 후 시간 갱신
        });
      }
    } else {
      // 활성 커밋이 없으면 큐에서 스폰 (딜레이 체크)
      const timeSinceLastSpawn = now - state.lastSpawnTime;
      const currentWaveConfig = WAVES[state.currentWave];
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

  // 내부 헬퍼: 웨이브 진행 또는 게임 종료
  advanceWaveOrEnd: () => {
    const state = get();
    const nextWaveIndex = state.currentWave + 1;

    if (nextWaveIndex >= WAVES.length) {
      // 모든 웨이브 클리어
      set({ gameState: "SUCCESS" });
      return;
    }

    // 새 웨이브의 브랜치가 추가되면 튜토리얼 표시
    const nextWave = WAVES[nextWaveIndex];
    const newBranches = nextWave.branches.filter(
      (b) => !state.activeBranches.includes(b),
    );

    if (newBranches.length > 0) {
      // 새 브랜치 등장 → 튜토리얼
      const newCommits = generateWaveCommits(nextWave);
      const [first, ...rest] = newCommits;
      set({
        gameState: "TUTORIAL",
        currentWave: nextWaveIndex,
        activeBranches: [...state.activeBranches, ...newBranches],
        // 첫 번째 커밋을 튜토리얼 중 화면에 미리 표시 (frozen at 40%)
        activeCommit: first ? { ...first, y: 40 } : null,
        commitQueue: rest,
      });
    } else {
      const newCommits = generateWaveCommits(nextWave);
      const [first, ...rest] = newCommits;
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
      case "CHECKOUT": {
        if (state.activeBranches.includes(parsed.branch)) {
          set({ currentBranch: parsed.branch, input: "" });

          // 튜토리얼 중 브랜치로 이동하면 게임 재개
          // activeCommit은 이미 튜토리얼에서 미리 표시된 첫 커밋 → y만 0으로 리셋
          if (state.gameState === "TUTORIAL") {
            set({
              gameState: "PLAYING",
              activeCommit: state.activeCommit
                ? { ...state.activeCommit, y: 0 }
                : null,
              lastSpawnTime: performance.now(),
            });
          }
        }
        break;
      }

      case "COMMIT":
      case "MERGE": {
        if (state.gameState !== "PLAYING" || !state.activeCommit) break;

        // 입력한 전체 명령어가 활성 커밋의 text와 일치해야 함
        if (
          state.input.trim() === state.activeCommit.text &&
          state.currentBranch === state.activeCommit.targetBranch
        ) {
          const newCombo = state.combo + 1;
          const newMaxCombo = Math.max(state.maxCombo, newCombo);
          const newDeployPercent = Math.min(
            100,
            state.deployPercent + DEPLOY_PER_COMMIT,
          );
          const newProcessed = state.processedCount + 1;

          // 새 브랜치가 처음 등장하면 분기점 기록
          const branchOrigins = { ...state.branchOrigins };
          const branchMergePoints = { ...state.branchMergePoints };
          const commit = state.activeCommit;
          if (
            commit.targetBranch !== "main" &&
            !branchOrigins[commit.targetBranch]
          ) {
            branchOrigins[commit.targetBranch] = commit.y;
          }

          // 머지 커밋이면 머지 지점 기록
          if (parsed.type === "MERGE") {
            branchMergePoints[parsed.branch] = commit.y;
          }

          // 아이템 드롭
          const items = [...state.items];
          if (
            commit.type === "item" &&
            commit.itemDrop &&
            items.length < MAX_ITEMS
          ) {
            items.push(ITEM_DEFINITIONS[commit.itemDrop]);
          }

          // 고정 커밋 추가
          const fixedCommits = [
            ...state.fixedCommits,
            { ...commit, isFixed: true },
          ];

          // 배포 100% 도달
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

          // 다음 커밋
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

          // 큐가 비었으면 웨이브 진행
          if (!next) {
            setTimeout(() => get().advanceWaveOrEnd(), 500);
          }
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
            // 활성 커밋 3초간 정지 (속도를 0으로 했다가 복구)
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
            // 활성 커밋 속도 50% 감소
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

      default:
        break;
    }

    set({ input: "" });
  },

  useItem: (itemType: ItemType) => {
    // submitCommand에서 "git stash" 등으로 처리하므로
    // 이 메서드는 단축키용 (나중에 확장)
    const state = get();
    const itemIndex = state.items.findIndex((i) => i.type === itemType);
    if (itemIndex === -1) return;
    set({ input: `git ${itemType}` });
    get().submitCommand();
  },

  reset: () => {
    set({
      gameState: "START",
      hearts: INITIAL_HEARTS,
      deployPercent: 0,
      timer: 0,
      combo: 0,
      maxCombo: 0,
      missCount: 0,
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
