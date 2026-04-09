import { motion } from "framer-motion";
import { PackageOpen, Keyboard } from "lucide-react"; // 🔥 Keyboard 아이콘으로 변경
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
        <div className="bg-yellow-500/20 p-4 rounded-full mb-4 relative">
          <PackageOpen size={48} className="text-yellow-400" />
          <motion.div
            className="absolute -bottom-2 -right-2 text-white bg-green-500 p-1.5 rounded-full shadow-lg"
            animate={{ y: [0, -3, 0] }} // 🔥 키보드를 누르는 듯한 상하 바운스 애니메이션
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Keyboard size={20} />
          </motion.div>
        </div>

        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
          아이템을 획득했습니다!
        </h2>

        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
          커밋 중{" "}
          <span className="text-yellow-400 font-bold">🎁 보상 아이템</span>을
          처리하면 우측 상단 슬롯에 보관됩니다.
          <br />
          <br />
          위급한 순간, 마우스로 손을 옮길 필요 없이
          <br />
          터미널에{" "}
          <span className="text-white font-bold bg-gray-700/50 px-2 py-1 rounded">
            숫자 1, 2, 3을 치고 엔터(↵)
          </span>
          를 누르세요!
        </p>

        <div className="flex flex-col gap-2 w-full mb-6">
          <div className="bg-black/50 p-3 rounded-lg border border-gray-700 flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-gray-800 text-yellow-400 font-bold text-[10px] px-1.5 py-0.5 rounded border border-gray-600">
                1 ↵
              </span>
              <span className="text-lg">📦</span>
              <span className="text-blue-400 font-bold font-mono">stash</span>
            </div>
            <span className="text-gray-400">커밋 낙하 3초 정지</span>
          </div>

          <div className="bg-black/50 p-3 rounded-lg border border-gray-700 flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-gray-800 text-yellow-400 font-bold text-[10px] px-1.5 py-0.5 rounded border border-gray-600">
                2 ↵
              </span>
              <span className="text-lg">⏱️</span>
              <span className="text-purple-400 font-bold font-mono">
                rebase
              </span>
            </div>
            <span className="text-gray-400">현재 커밋 속도 50% 감소</span>
          </div>

          <div className="bg-black/50 p-3 rounded-lg border border-gray-700 flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-gray-800 text-yellow-400 font-bold text-[10px] px-1.5 py-0.5 rounded border border-gray-600">
                3 ↵
              </span>
              <span className="text-lg">💖</span>
              <span className="text-red-400 font-bold font-mono">heal</span>
            </div>
            <span className="text-gray-400">하트(생명력) 1개 회복</span>
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
