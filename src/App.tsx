import { useEffect } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { Terminal } from "./components/Terminal";
import { startGameLoop, stopGameLoop } from "./engine/gameLoop";

export default function App() {
  useEffect(() => {
    startGameLoop();
    return () => stopGameLoop();
  }, []);

  return (
    <div className="h-screen w-screen bg-[#0d1117] text-white flex flex-col font-mono overflow-hidden select-none">
      {/* 게임 캔버스 (70%) */}
      <div className="flex-grow" style={{ height: "70%" }}>
        <GameCanvas />
      </div>

      {/* 터미널 (30%) */}
      <div style={{ height: "30%" }}>
        <Terminal />
      </div>
    </div>
  );
}
