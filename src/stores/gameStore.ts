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
  branchParents: Record<string, string>; // 부모 브랜치 추적

  activeCommit: CommitNode | null;
  fixedCommits: CommitNode[];
  commitQueue: CommitNode[];
  processedCount: number;

  currentWave: number;
  items: Item[];
  input: string;
  hasSeenItemTutorial: boolean; // 튜토리얼 시청 여부

  lastSpawnTime: number;
  gameStartTime: number;
  lastTickTime: number;

  startGame: (mode: GameMode) => void;
  tick: (now: number) => void;
  setInput: (input: string) => void;
  appendInput: (char: string) => void;
  backspace: () => void;
  submitCommand: () => void;
  useItem: (itemType: ItemType) => void;
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
    if (state.gameState !== "PLAYING") return; // 일시정지 보호

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

    // 1. 웨이브 종료 체크 (성공)
    if (nextWaveIndex >= waves.length) {
      set({ gameState: "SUCCESS" });
      return;
    }

    const nextWave = waves[nextWaveIndex];

    // 2. 이미 병합 완료된(죽은) 브랜치 목록 추출
    const mergedBranches = Object.keys(state.branchMergePoints);

    // 3. 이번 웨이브에서 새롭게 등장해야 할 브랜치 계산 (이미 활성화됐거나 병합된 것 제외)
    const newBranches = nextWave.branches.filter(
      (b) => !state.activeBranches.includes(b) && !mergedBranches.includes(b),
    );

    // 4. 일반 커밋 큐 생성 (병합된 브랜치에는 커밋이 안 떨어지도록 필터링 배열 전달)
    const newCommits = generateWaveCommits(nextWave, mergedBranches);

    if (newBranches.length > 0) {
      if (state.gameMode === "single") {
        // 🔥 핵심 수정 사항: 싱글 모드 새 브랜치(checkout -b) 노드 주입
        // 병합되지 않고 '살아있는' 브랜치만 후보군으로 추출합니다.
        let aliveBranches = state.activeBranches.filter(
          (b) => !mergedBranches.includes(b),
        );

        // 혹시라도 살아있는 브랜치가 없다면 최후의 보루로 main을 사용합니다.
        if (aliveBranches.length === 0) aliveBranches = ["main"];

        const checkoutNodes = newBranches.map((b) => {
          // 죽은 브랜치(예: feature)를 배제한 aliveBranches 안에서만 무작위 출발점을 고릅니다.
          const randomSource =
            aliveBranches[Math.floor(Math.random() * aliveBranches.length)];
          return generateCheckoutNode(b, randomSource, nextWave.speed);
        });

        newCommits.unshift(...checkoutNodes);
      } else {
        // 튜토리얼 모드: 팝업 기믹용으로 첫 커밋을 강제로 새 브랜치 타겟으로 스왑
        const targetBranch = newBranches[0];
        const firstNewIdx = newCommits.findIndex((c) =>
          newBranches.includes(c.targetBranch),
        );
        if (firstNewIdx > 0) {
          [newCommits[0], newCommits[firstNewIdx]] = [
            newCommits[firstNewIdx],
            newCommits[0],
          ];
        } else if (firstNewIdx === -1) {
          newCommits[0] = { ...newCommits[0], targetBranch };
        }
      }
    }

    const [first, ...rest] = newCommits;
    const waveNumber = nextWaveIndex + 1;

    // 5. 모드별 상태 전이
    if (state.gameMode === "single") {
      set({
        gameState: "WAVE_TRANSITION",
        currentWave: nextWaveIndex,
        activeBranches: [...state.activeBranches, ...newBranches],
        activeCommit: first ? { ...first, y: 0 } : null,
        commitQueue: rest,
        waveAnnouncement: waveNumber,
      });

      // 1.2초 후 게임 재개 및 시간 동기화 (텔레포트 버그 방지)
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
      // 튜토리얼 모드: 새 브랜치 등장 시 팝업 띄우기
      set({
        gameState: "BRANCH_INTRO",
        currentWave: nextWaveIndex,
        activeBranches: [...state.activeBranches, ...newBranches],
        activeCommit: first ? { ...first, y: 40 } : null,
        commitQueue: rest,
      });
    } else {
      // 튜토리얼에서 새 브랜치가 없는 일반 웨이브 진행 시
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
        // 🔥 오직 튜토리얼 모드에서만! 싱글 플레이일 때는 절대 팝업 안 띄움
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
          // 튜토리얼/새 브랜치 팝업 대기 중일 때: 현재 떠있는 커밋의 위치를 분기점으로 기록
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
            branchOrigins, // 🔥 분기점 즉시 저장!
            input: "",
          });
        } else if (state.gameState === "PLAYING") {
          // 플레이 도중 자유롭게 입력했을 때: 현재 떨어지고 있는 커밋 위치 기준
          if (branchOrigins[parsed.branch] === undefined) {
            branchOrigins[parsed.branch] = state.activeCommit
              ? state.activeCommit.y
              : 0;
          }
          set({
            currentBranch: parsed.branch,
            branchOrigins, // 🔥 분기점 즉시 저장!
            input: "",
          });
        }
        break;
      }
      case "CHECKOUT":
        if (state.activeBranches.includes(parsed.branch))
          set({ currentBranch: parsed.branch, input: "" });
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
            hearts: Math.min(INITIAL_HEARTS, state.hearts + 1),
            items: newItems,
            input: "",
          });
          return;
        }
      }
    }

    if (state.gameState === "PLAYING" && state.activeCommit)
      set({ combo: 0, wrongCount: state.wrongCount + 1, input: "" });
    else set({ input: "" });
  },

  useItem: (itemType: ItemType) => {
    const state = get();
    const itemIndex = state.items.findIndex((i) => i.type === itemType);
    if (itemIndex === -1) return;
    set({ input: `git ${itemType}` });
    get().submitCommand();
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
