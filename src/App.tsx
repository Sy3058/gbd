import { useEffect } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { HUD } from "./components/HUD";
import { Terminal } from "./components/Terminal";
import { startGameLoop, stopGameLoop } from "./engine/gameLoop";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

export default function App() {
  useEffect(() => {
    startGameLoop();
    return () => stopGameLoop();
  }, []);

  return (
    <div className="h-screen w-screen bg-[#0d1117] text-white flex flex-col font-mono overflow-hidden select-none">
      {/* HUD 헤더 */}
      <HUD />

      {/* 게임 캔버스 */}
      <div className="flex-[7] min-h-0">
        <GameCanvas />
      </div>

      {/* 터미널 */}
      <div className="flex-[3] min-h-0">
        <Terminal />
      </div>

      <Analytics />
      <SpeedInsights />
    </div>
  );
}
