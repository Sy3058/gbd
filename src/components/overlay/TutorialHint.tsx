import { motion } from "framer-motion";
import type { BranchName, CommitNode } from "../../types";

interface Props {
  commit: CommitNode;
  currentBranch: BranchName;
}

export function TutorialHint({ commit, currentBranch }: Props) {
  const needCheckout = currentBranch !== commit.targetBranch;

  return (
    <motion.div
      key={commit.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute bottom-4 left-4 z-20 bg-[#1e293b]/90 border border-yellow-500/40 rounded-lg p-3 max-w-xs text-xs font-mono"
    >
      <p className="text-yellow-400 font-bold mb-1">💡 힌트</p>
      {needCheckout ? (
        <>
          <p className="text-gray-400 mb-1">
            먼저 브랜치를 이동하세요:
          </p>
          <p className="text-green-400">git checkout {commit.targetBranch}</p>
          <p className="text-gray-500 mt-1">이후: {commit.text}</p>
        </>
      ) : (
        <>
          <p className="text-gray-400 mb-1">입력할 명령어:</p>
          <p className="text-green-400">{commit.text}</p>
        </>
      )}
    </motion.div>
  );
}
