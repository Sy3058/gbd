import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { clsx } from "clsx";
import { useGameStore } from "../stores/gameStore";

export function HUD() {
  const hearts = useGameStore((s) => s.hearts);
  const deployPercent = useGameStore((s) => s.deployPercent);
  const timer = useGameStore((s) => s.timer);
  const combo = useGameStore((s) => s.combo);
  const items = useGameStore((s) => s.items);
  const currentWave = useGameStore((s) => s.currentWave);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <div className="flex justify-between items-center px-4 py-2 bg-[#0d1117] border-b border-gray-800 shrink-0">
      {/* 좌측: 하트 + 콤보 */}
      <div className="flex items-center gap-3">
        <motion.div
          className="flex gap-1"
          animate={hearts < 3 ? { x: [-5, 5, -3, 3, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              size={24}
              className={clsx(
                "transition-all duration-300",
                i < hearts
                  ? "fill-red-500 text-red-500"
                  : "fill-gray-700 text-gray-700",
              )}
            />
          ))}
        </motion.div>

        {combo > 1 && (
          <motion.div
            key={combo}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-yellow-400 font-bold text-sm"
          >
            🔥 {combo} COMBO
          </motion.div>
        )}
      </div>

      {/* 중앙: 배포 게이지 */}
      <div className="flex flex-col items-center gap-1 min-w-[200px]">
        <div className="text-xs text-gray-400">
          WAVE {currentWave + 1} / {3}
        </div>
        <div className="w-full bg-gray-800 rounded-full h-4 border border-gray-600 overflow-hidden">
          <motion.div
            className={clsx(
              "h-full rounded-full transition-colors",
              deployPercent < 30 && "bg-red-500",
              deployPercent >= 30 && deployPercent < 70 && "bg-yellow-500",
              deployPercent >= 70 && "bg-green-500",
            )}
            animate={{ width: `${deployPercent}%` }}
            transition={{ type: "spring", stiffness: 80 }}
          />
        </div>
        <div className="text-xs text-gray-300 font-bold">
          DEPLOY {Math.floor(deployPercent)}%
        </div>
      </div>

      {/* 우측: 타이머 + 아이템 */}
      <div className="flex items-center gap-3">
        <div className="text-lg font-bold text-gray-300 tabular-nums">
          {formatTime(timer)}
        </div>
        <div className="flex gap-1">
          {items.map((item, i) => (
            <div
              key={i}
              className={clsx(
                "w-8 h-8 rounded border flex items-center justify-center text-[10px]",
                item.type === "stash" && "border-blue-500 bg-blue-500/20",
                item.type === "rebase" && "border-purple-500 bg-purple-500/20",
                item.type === "heal" && "border-red-500 bg-red-500/20",
              )}
              title={`${item.name}: ${item.description}`}
            >
              {item.type === "stash" && "📦"}
              {item.type === "rebase" && "🔀"}
              {item.type === "heal" && "💊"}
            </div>
          ))}
          {/* 빈 슬롯 */}
          {Array.from({ length: 3 - items.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-8 h-8 rounded border border-gray-700 bg-gray-800/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
