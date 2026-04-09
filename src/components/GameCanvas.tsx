import { AnimatePresence } from "framer-motion";
import { useGameStore } from "../stores/gameStore";
import { BranchLane } from "./Branchlane";
import { CommitNode } from "./CommitNode";
import { StartScreen } from "./overlay/StartScreen";
import { GameOverScreen } from "./overlay/GameOverScreen";
import { SuccessScreen } from "./overlay/SuccessScreen";
import { TutorialPopup } from "./overlay/TutorialPropup";
import { TutorialHint } from "./overlay/TutorialHint";
import type { BranchName } from "../types";

// 브랜치별 X 위치
const BRANCH_POSITIONS: Record<string, string> = {
  main: "30%",
  feature: "50%",
  hotfix: "70%",
};

function getBranchLeft(branch: BranchName): string {
  return BRANCH_POSITIONS[branch] ?? "50%";
}

export function GameCanvas() {
  const gameState = useGameStore((s) => s.gameState);
  const gameMode = useGameStore((s) => s.gameMode);
  const currentBranch = useGameStore((s) => s.currentBranch);
  const activeBranches = useGameStore((s) => s.activeBranches);
  const branchOrigins = useGameStore((s) => s.branchOrigins);
  const branchMergePoints = useGameStore((s) => s.branchMergePoints);
  const activeCommit = useGameStore((s) => s.activeCommit);
  const fixedCommits = useGameStore((s) => s.fixedCommits);

  return (
    <div className="relative h-full overflow-hidden border-b border-gray-800">
      {/* 브랜치 라인 */}
      <div className="absolute inset-0 w-full h-full">
        {activeBranches.map((branch) => (
          <BranchLane
            key={branch}
            branch={branch}
            isActive={currentBranch === branch}
            leftPosition={getBranchLeft(branch)}
            originY={branchOrigins[branch]}
            parentLeft={branch !== "main" ? getBranchLeft("main") : undefined}
            mergeY={branchMergePoints[branch]}
          />
        ))}
      </div>

      {/* 고정 커밋 */}
      <AnimatePresence>
        {fixedCommits.map((commit) => (
          <CommitNode
            key={`fixed-${commit.id}`}
            commit={commit}
            isActive={false}
            leftPosition={getBranchLeft(commit.targetBranch)}
          />
        ))}
      </AnimatePresence>

      {/* 활성 커밋 */}
      <AnimatePresence>
        {activeCommit && (
          <CommitNode
            key={`active-${activeCommit.id}`}
            commit={activeCommit}
            isActive={true}
            leftPosition={getBranchLeft(activeCommit.targetBranch)}
          />
        )}
      </AnimatePresence>

      {/* 튜토리얼 모드 힌트 */}
      {gameMode === "tutorial" && gameState === "PLAYING" && activeCommit && (
        <TutorialHint commit={activeCommit} currentBranch={currentBranch} />
      )}

      {/* 오버레이 */}
      <AnimatePresence>
        {gameState === "START" && <StartScreen />}
        {gameState === "GAMEOVER" && <GameOverScreen />}
        {gameState === "SUCCESS" && <SuccessScreen />}
        {gameState === "BRANCH_INTRO" && <TutorialPopup />}
      </AnimatePresence>
    </div>
  );
}
