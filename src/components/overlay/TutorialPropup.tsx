import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { useGameStore } from "../../stores/gameStore";

export function TutorialPopup() {
  const activeBranches = useGameStore((s) => s.activeBranches);
  // const submitCommand = useGameStore((s) => s.submitCommand);

  // 가장 최근에 추가된 브랜치
  const newBranch = activeBranches[activeBranches.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#1e293b] border border-blue-500/50 p-6 rounded-xl text-center shadow-2xl flex flex-col items-center max-w-sm relative"
      >
        <Info size={40} className="text-blue-400 mb-4 animate-bounce mt-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          신규 브랜치 감지됨!
        </h2>
        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
          새 커밋이{" "}
          <span className="text-purple-400 font-bold">{newBranch}</span>{" "}
          레인에서 내려옵니다.
          <br />
          터미널에 아래 명령어를 입력하여
          <br />
          현재 위치(HEAD)를 이동하세요.
        </p>
        <div className="bg-black/50 px-4 py-2 rounded text-green-400 font-mono text-sm border border-gray-700 w-full mb-2 shadow-inner">
          git checkout {newBranch}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          명령어를 입력하여 계속 진행
        </p>
      </motion.div>
    </motion.div>
  );
}
