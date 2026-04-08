import { motion } from "framer-motion";
import { GitBranch, Play } from "lucide-react";
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
        className="bg-[#161b22] border border-gray-700 p-10 rounded-2xl text-center shadow-2xl flex flex-col items-center max-w-md"
      >
        <GitBranch size={56} className="text-blue-500 mb-6" />
        <h1 className="text-white text-3xl font-black mb-2 tracking-tighter">
          Git Branch Defense
        </h1>
        <p className="text-gray-400 mb-8 text-sm">
          올바른 브랜치로 이동(checkout)하여 커밋을 성공시키세요.
        </p>
        <button
          onClick={startGame}
          className="flex items-center gap-2 bg-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-500 transition-all cursor-pointer"
        >
          <Play size={20} /> INITIALIZE GAME
        </button>
      </motion.div>
    </motion.div>
  );
}
