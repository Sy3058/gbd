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

export function generateWaveCommits(wave: WaveConfig): CommitNode[] {
  const commits: CommitNode[] = [];
  const usedMessages = new Set<number>();
  // 각 브랜치에서 첫 번째 커밋인지 추적 (첫 커밋은 merge 금지)
  const seenBranches = new Set<string>();

  for (let i = 0; i < wave.commitCount; i++) {
    // 랜덤 메시지 선택 (중복 방지)
    let msgIndex: number;
    do {
      msgIndex = Math.floor(Math.random() * COMMIT_MESSAGES.length);
    } while (
      usedMessages.has(msgIndex) &&
      usedMessages.size < COMMIT_MESSAGES.length
    );
    usedMessages.add(msgIndex);

    const msg = COMMIT_MESSAGES[msgIndex];

    // 랜덤 브랜치 배정
    const branch =
      wave.branches[Math.floor(Math.random() * wave.branches.length)];

    // 아이템 드롭 판정
    const isItemCommit = Math.random() < wave.itemDropRate;
    const itemTypes: ItemType[] = ["stash", "rebase", "heal"];
    const itemDrop = isItemCommit
      ? itemTypes[Math.floor(Math.random() * itemTypes.length)]
      : undefined;

    // merge 커밋: non-main 브랜치에서만, 해당 브랜치 첫 커밋 제외, mergeRate 확률 (기본 0.2)
    const isFirstOnBranch = !seenBranches.has(branch);
    seenBranches.add(branch);
    const mergeRate = wave.mergeRate ?? 0.2;
    const isMerge =
      wave.branches.length > 1 &&
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
  }

  return commits;
}
