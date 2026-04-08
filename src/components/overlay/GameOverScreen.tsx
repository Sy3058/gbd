import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useGameStore } from "../../stores/gameStore";

export function GameOverScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const timer = useGameStore((s) => s.timer);
  const maxCombo = useGameStore((s) => s.maxCombo);
  const deployPercent = useGameStore((s) => s.deployPercent);

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
        <AlertCircle size={56} className="text-red-500 mb-6" />
        <h1 className="text-3xl font-black text-red-400 mb-2">Build Failed!</h1>
        <div className="text-gray-400 text-sm mb-6 space-y-1">
          <p>배포 진행률: {Math.floor(deployPercent)}%</p>
          <p>최대 콤보: {maxCombo}</p>
          <p>시간: {Math.floor(timer / 1000)}초</p>
        </div>
        <button
          onClick={startGame}
          className="flex items-center gap-2 bg-red-600 px-8 py-3 rounded-lg font-bold hover:bg-red-500 transition-all cursor-pointer"
        >
          <RefreshCw size={20} /> RETRY
        </button>
      </motion.div>
    </motion.div>
  );
}
