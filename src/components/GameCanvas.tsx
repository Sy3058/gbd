import { AnimatePresence } from "framer-motion";
import { useGameStore } from "../stores/gameStore";
import { BranchLane } from "./Branchlane";
import { CommitNode } from "./CommitNode";
import { HUD } from "./HUD";
import { StartScreen } from "./overlay/StartScreen";
import { GameOverScreen } from "./overlay/GameOverScreen";
import { SuccessScreen } from "./overlay/SuccessScreen";
import { TutorialPopup } from "./overlay/TutorialPropup";
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
  const currentBranch = useGameStore((s) => s.currentBranch);
  const activeBranches = useGameStore((s) => s.activeBranches);
  const branchOrigins = useGameStore((s) => s.branchOrigins);
  const branchMergePoints = useGameStore((s) => s.branchMergePoints);
  const activeCommit = useGameStore((s) => s.activeCommit);
  const fixedCommits = useGameStore((s) => s.fixedCommits);

  return (
    <div className="relative h-full overflow-hidden border-b border-gray-800">
      {/* CSS 애니메이션 정의 */}
      <style>{`
        @keyframes draw-curve-up {
          0% { stroke-dashoffset: 250; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes scale-up-y {
          0% { transform: scaleY(0); }
          100% { transform: scaleY(1); }
        }
      `}</style>

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

      {/* HUD */}
      <HUD />

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

      {/* 오버레이 */}
      <AnimatePresence>
        {gameState === "START" && <StartScreen />}
        {gameState === "GAMEOVER" && <GameOverScreen />}
        {gameState === "SUCCESS" && <SuccessScreen />}
        {gameState === "TUTORIAL" && <TutorialPopup />}
      </AnimatePresence>
    </div>
  );
}
