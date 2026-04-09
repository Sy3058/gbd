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

      {/* 우측: 타이머 + 아이템 슬롯 */}
      <div className="flex items-center gap-5">
        <div className="text-lg font-bold text-gray-300 tabular-nums">
          {formatTime(timer)}
        </div>

        {/* 🔥 키보드 입력 전용 아이템 슬롯 UI */}
        <div className="flex gap-3">
          {[0, 1, 2].map((index) => {
            const item = items[index];

            return (
              // button 태그를 div로 변경하고 클릭 관련 속성 제거
              <div
                key={index}
                className={clsx(
                  "relative flex items-center justify-center gap-2 px-3 py-2 w-28 rounded-lg border text-sm font-bold transition-all",
                  item
                    ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-100 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                    : "border-gray-700 bg-gray-800/50 text-gray-600",
                )}
                title={item ? `${item.name}: ${item.description}` : "빈 슬롯"}
              >
                {/* 🔥 슬롯 번호 단축키 뱃지 (엔터 기호 추가) */}
                <span className="absolute -top-2 -left-2 bg-gray-800 border border-gray-600 text-yellow-400 font-mono px-2 h-5 flex items-center justify-center rounded-md text-[10px]">
                  {index + 1} ↵
                </span>

                {/* 아이템 내용 또는 Empty */}
                {item ? (
                  <>
                    <span className="text-lg">
                      {item.type === "stash"
                        ? "📦"
                        : item.type === "rebase"
                          ? "⏱️"
                          : "💖"}
                    </span>
                    <span>{item.type}</span>
                  </>
                ) : (
                  <span className="w-full text-center">Empty</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
