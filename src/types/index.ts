export type GameState =
  | "START"
  | "PLAYING"
  | "TUTORIAL"
  | "GAMEOVER"
  | "SUCCESS";
export type BranchName = "main" | "feature" | "hotfix" | string;

export type ItemType = "stash" | "rebase" | "heal";

export interface CommitNode {
  id: number;
  targetBranch: BranchName;
  text: string; // 유저가 입력해야 하는 전체 명령어
  displayText: string; // 화면에 표시될 커밋 메시지 (짧은 버전)
  y: number; // 0~100 (퍼센트 기반 위치)
  speed: number; // 낙하 속도
  type: "normal" | "item" | "boss";
  itemDrop?: ItemType; // type이 "item"일 때 어떤 아이템을 드롭하는지
  isFixed?: boolean;
}

export interface Item {
  type: ItemType;
  name: string;
  description: string;
}

export type CommandResult =
  | { type: "COMMIT"; message: string }
  | { type: "CHECKOUT"; branch: BranchName }
  | { type: "MERGE"; branch: BranchName }
  | { type: "ITEM_USE"; item: ItemType }
  | { type: "UNKNOWN"; raw: string };

export interface WaveConfig {
  wave: number;
  commitCount: number;
  speed: number;
  spawnInterval: number;
  branches: BranchName[];
  itemDropRate: number;
}

export type Grade = "S" | "A" | "B" | "C" | "D";

export interface ScoreData {
  clearTime: number; // ms
  maxCombo: number;
  missCount: number;
  grade: Grade;
  date: string;
}
