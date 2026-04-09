import type { CommitNode, WaveConfig, ItemType } from "../types";
import {
  COMMIT_MESSAGES,
  generateCommitCommand,
  generateMergeCommand,
} from "../data/command";

let nextId = 0;

export function resetIdCounter() {
  nextId = 0;
}

export function generateCheckoutNode(
  branch: string,
  sourceBranch: string,
  speed: number,
): CommitNode {
  return {
    id: nextId++,
    targetBranch: sourceBranch,
    text: `git checkout -b ${branch}`,
    displayText: `checkout -b ${branch}`,
    y: 0,
    speed,
    type: "normal",
  };
}

// 🔥 수정됨: 이전에 이미 병합된 브랜치 목록(mergedBranches)을 인자로 받습니다.
export function generateWaveCommits(
  wave: WaveConfig,
  mergedBranches: string[] = [],
): CommitNode[] {
  const commits: CommitNode[] = [];
  const usedMessages = new Set<number>();
  const seenBranches = new Set<string>();

  // 🔥 1. 이미 과거 웨이브에서 병합된 브랜치는 이번 웨이브 후보군에서 아예 제외합니다.
  let availableBranches = wave.branches.filter(
    (b) => !mergedBranches.includes(b),
  );

  // 만약 모든 서브 브랜치가 병합되어 남은 게 없다면 main으로 강제 할당
  if (availableBranches.length === 0) availableBranches = ["main"];

  for (let i = 0; i < wave.commitCount; i++) {
    // 메시지 선택
    let msgIndex: number;
    do {
      msgIndex = Math.floor(Math.random() * COMMIT_MESSAGES.length);
    } while (
      usedMessages.has(msgIndex) &&
      usedMessages.size < COMMIT_MESSAGES.length
    );
    usedMessages.add(msgIndex);

    const msg = COMMIT_MESSAGES[msgIndex];

    // 랜덤 브랜치 배정 (필터링된 availableBranches 안에서만)
    const branch =
      availableBranches[Math.floor(Math.random() * availableBranches.length)];

    // 아이템 드롭 판정
    const isItemCommit = Math.random() < wave.itemDropRate;
    const itemTypes: ItemType[] = ["stash", "rebase", "heal"];
    const itemDrop = isItemCommit
      ? itemTypes[Math.floor(Math.random() * itemTypes.length)]
      : undefined;

    const isFirstOnBranch = !seenBranches.has(branch);
    seenBranches.add(branch);
    const mergeRate = wave.mergeRate ?? 0.2;

    // 머지 커밋 판정
    const isMerge =
      availableBranches.length > 1 &&
      branch !== "main" &&
      !isFirstOnBranch &&
      Math.random() < mergeRate;

    const text = isMerge
      ? generateMergeCommand(branch)
      : generateCommitCommand(msg.message);

    commits.push({
      id: nextId++,
      targetBranch: branch,
      text,
      displayText: isMerge ? `merge ${branch} → main` : msg.display,
      y: 0,
      speed: wave.speed,
      type: isItemCommit ? "item" : "normal",
      itemDrop,
    });

    // 🔥 2. 현재 웨이브 생성 중에 병합(Merge) 노드를 만들었다면,
    // 그 즉시 이후 남은 반복문의 배정 후보군에서 해당 브랜치를 삭제합니다!
    if (isMerge) {
      availableBranches = availableBranches.filter((b) => b !== branch);
      if (availableBranches.length === 0) availableBranches = ["main"];
    }
  }

  return commits;
}
