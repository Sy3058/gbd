import { motion } from "framer-motion";
import { useGameStore } from "../../stores/gameStore";

export function WaveScreen() {
  const waveAnnouncement = useGameStore((s) => s.waveAnnouncement);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.5, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="text-center"
      >
        <h2 className="text-6xl font-black text-white tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">
          WAVE {waveAnnouncement}
        </h2>
        <p className="text-blue-300 mt-4 text-lg font-bold animate-pulse">
          GET READY...
        </p>
      </motion.div>
    </motion.div>
  );
}
