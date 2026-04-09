import type { CommandResult, BranchName, ItemType } from "../types";

export function parseGitCommand(input: string): CommandResult {
  const trimmed = input.trim();

  // git commit -m "message"
  const commitMatch = trimmed.match(/^git commit -m "(.+)"$/);
  if (commitMatch) {
    return { type: "COMMIT", message: commitMatch[1] };
  }

  // git checkout -b <branch> (새 브랜치 생성 + 이동) — 반드시 일반 checkout보다 먼저 체크
  const checkoutNewMatch = trimmed.match(/^git checkout -b (.+)$/);
  if (checkoutNewMatch) {
    return { type: "CHECKOUT_NEW", branch: checkoutNewMatch[1] as BranchName };
  }

  // git checkout <branch>
  const checkoutMatch = trimmed.match(/^git checkout (.+)$/);
  if (checkoutMatch) {
    return { type: "CHECKOUT", branch: checkoutMatch[1] as BranchName };
  }

  // git merge <branch>
  const mergeMatch = trimmed.match(/^git merge (.+)$/);
  if (mergeMatch) {
    return { type: "MERGE", branch: mergeMatch[1] as BranchName };
  }

  // 아이템 사용 명령어
  const itemMap: Record<string, ItemType> = {
    "git stash": "stash",
    "git rebase": "rebase",
  };
  if (itemMap[trimmed]) {
    return { type: "ITEM_USE", item: itemMap[trimmed] };
  }

  return { type: "UNKNOWN", raw: trimmed };
}
