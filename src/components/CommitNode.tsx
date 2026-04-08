import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import type { CommitNode as CommitNodeType } from "../types";

interface Props {
  commit: CommitNodeType;
  isActive: boolean;
  leftPosition: string;
}

export function CommitNode({ commit, isActive, leftPosition }: Props) {
  return (
    <motion.div
      key={commit.id}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
      className="absolute flex flex-col items-center pointer-events-none"
      style={{
        top: `${commit.y}%`,
        left: leftPosition,
        marginLeft: "-110px",
        width: "220px",
      }}
    >
      {/* 노드 원형 */}
      <div
        className={clsx(
          "w-6 h-6 rounded-full border-4 flex justify-center items-center",
          isActive &&
            "bg-gray-900 border-white/80 animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.5)]",
          !isActive &&
            "bg-green-500 border-green-200 shadow-[0_0_10px_rgba(34,197,94,0.6)]",
          commit.type === "item" &&
            isActive &&
            "border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.8)]",
        )}
      >
        {!isActive && <CheckCircle2 size={12} className="text-white" />}
        {commit.type === "item" && isActive && (
          <span className="text-[8px]">🎁</span>
        )}
      </div>

      {/* 명령어 텍스트 (활성 커밋만) */}
      {isActive && (
        <div
          className={clsx(
            "mt-2 px-3 py-1.5 rounded-md text-[11px] border shadow-xl whitespace-nowrap",
            commit.type === "item"
              ? "bg-yellow-900/90 border-yellow-500"
              : "bg-black/90 border-gray-500",
          )}
        >
          {commit.text}
        </div>
      )}
    </motion.div>
  );
}
