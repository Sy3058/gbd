import clsx from "clsx";
import { motion } from "framer-motion";
import { CheckCircle2, Home, Play, RefreshCw } from "lucide-react";
import { useGameStore } from "../../stores/gameStore";

export function SuccessScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const reset = useGameStore((s) => s.reset);
  const gameMode = useGameStore((s) => s.gameMode);
  const timer = useGameStore((s) => s.timer);
  const maxCombo = useGameStore((s) => s.maxCombo);
  const missCount = useGameStore((s) => s.missCount);
  const wrongCount = useGameStore((s) => s.wrongCount);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  };

  // 등급 계산
  const getGrade = () => {
    const score =
      maxCombo * 100 - missCount * 200 - wrongCount * 50 - timer / 1000;
    if (score > 800)
      return { grade: "S", label: "아키텍트", color: "text-yellow-400" };
    if (score > 500)
      return { grade: "A", label: "시니어", color: "text-purple-400" };
    if (score > 200)
      return { grade: "B", label: "주니어", color: "text-blue-400" };
    if (score > 0)
      return { grade: "C", label: "인턴", color: "text-green-400" };
    return { grade: "D", label: "스파게티", color: "text-red-400" };
  };

  const { grade, label, color } = getGrade();

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
        <CheckCircle2 size={56} className="text-green-500 mb-4" />
        <h1 className="text-3xl font-black text-green-400 mb-2">
          Deploy Success!
        </h1>

        {/* 등급 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="my-4"
        >
          <span className={clsx("text-7xl font-black", color)}>{grade}</span>
          <p className={clsx("text-sm mt-1", color)}>{label}</p>
        </motion.div>

        {/* 상세 결과 */}
        <div className="text-gray-400 text-sm mb-6 space-y-1">
          <p>⏱ 클리어 시간: {formatTime(timer)}</p>
          <p>🔥 최대 콤보: {maxCombo}</p>
          <p>💔 미스 횟수: {missCount}</p>
          <p>✏️ 오타 횟수: {wrongCount}</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {gameMode === "tutorial" ? (
            <>
              <button
                onClick={() => startGame("single")}
                className="flex items-center justify-center gap-2 bg-green-600 px-8 py-3 rounded-lg font-bold hover:bg-green-500 transition-all cursor-pointer"
              >
                <Play size={20} /> 게임 시작
              </button>
              <button
                onClick={() => startGame("tutorial")}
                className="flex items-center justify-center gap-2 bg-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-500 transition-all cursor-pointer"
              >
                <RefreshCw size={20} /> 튜토리얼 다시하기
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => startGame("single")}
                className="flex items-center justify-center gap-2 bg-green-600 px-8 py-3 rounded-lg font-bold hover:bg-green-500 transition-all cursor-pointer"
              >
                <RefreshCw size={20} /> 다시하기
              </button>
              <button
                onClick={() => reset()}
                className="flex items-center justify-center gap-2 bg-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-600 transition-all cursor-pointer text-white"
              >
                <Home size={20} /> 메인 메뉴로
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
