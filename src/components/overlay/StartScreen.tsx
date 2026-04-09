import { motion } from "framer-motion";
import { BookOpen, GitBranch, Play } from "lucide-react";
import { useGameStore } from "../../stores/gameStore";

export function StartScreen() {
  const startGame = useGameStore((s) => s.startGame);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#161b22] border border-gray-700 p-10 rounded-2xl text-center shadow-2xl flex flex-col items-center max-w-md w-full"
      >
        <GitBranch size={56} className="text-blue-500 mb-6" />
        <h1 className="text-white text-3xl font-black mb-2 tracking-tighter">
          Git Branch Defense
        </h1>
        <p className="text-gray-400 mb-8 text-sm">
          올바른 브랜치로 이동하여 커밋을 처리하세요.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => startGame("tutorial")}
            className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 px-8 py-3 rounded-lg font-bold transition-all cursor-pointer w-full"
          >
            <BookOpen size={20} />
            튜토리얼
          </button>
          <button
            onClick={() => startGame("single")}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-lg font-bold transition-all cursor-pointer w-full"
          >
            <Play size={20} />
            게임 시작
          </button>
        </div>

        <p className="text-gray-600 text-xs mt-6">
          튜토리얼에서 기본 명령어를 익히세요
        </p>
      </motion.div>
    </motion.div>
  );
}
