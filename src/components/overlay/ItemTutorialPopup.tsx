import { motion } from "framer-motion";
import { PackageOpen } from "lucide-react";
import { useGameStore } from "../../stores/gameStore";

export function ItemTutorialPopup() {
  const closeItemTutorial = useGameStore((s) => s.closeItemTutorial);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#1e293b] border border-yellow-500/50 p-8 rounded-2xl text-center shadow-2xl flex flex-col items-center max-w-md w-full"
      >
        <div className="bg-yellow-500/20 p-4 rounded-full mb-4">
          <PackageOpen size={48} className="text-yellow-400 animate-pulse" />
        </div>

        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
          아이템을 획득했습니다!
        </h2>

        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
          커밋 중{" "}
          <span className="text-yellow-400 font-bold">🎁 보상 아이템</span>을
          처리하면 우측 상단 슬롯에 아이템이 보관됩니다.
          <br />
          <br />
          위급한 순간, 아래의 Git 명령어를 입력하여
          <br />
          아이템을 사용해보세요.
        </p>

        <div className="flex flex-col gap-2 w-full mb-6">
          <div className="bg-black/50 p-3 rounded-lg border border-gray-700 flex justify-between items-center text-sm">
            <code className="text-blue-400 font-bold font-mono">git stash</code>
            <span className="text-gray-400">커밋 낙하 3초 정지</span>
          </div>
          <div className="bg-black/50 p-3 rounded-lg border border-gray-700 flex justify-between items-center text-sm">
            <code className="text-purple-400 font-bold font-mono">
              git rebase
            </code>
            <span className="text-gray-400">현재 커밋 속도 50% 감소</span>
          </div>
        </div>

        <button
          onClick={closeItemTutorial}
          className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-[0_0_15px_rgba(202,138,4,0.5)] cursor-pointer"
        >
          확인하고 계속하기
        </button>
      </motion.div>
    </motion.div>
  );
}
