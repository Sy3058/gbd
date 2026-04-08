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

    // 명령어 텍스트 생성
    // 일부 커밋은 merge 명령어로 생성 (wave 2부터, 20% 확률)
    const isMerge = wave.branches.length > 1 && Math.random() < 0.2;
    const text = isMerge
      ? generateMergeCommand(branch === "main" ? wave.branches[1] : "main")
      : generateCommitCommand(msg.message);

    commits.push({
      id: nextId++,
      targetBranch: branch,
      text,
      displayText: isMerge ? `merge → ${branch}` : msg.display,
      y: 0,
      speed: wave.speed,
      type: isItemCommit ? "item" : "normal",
      itemDrop,
    });
  }

  return commits;
}
