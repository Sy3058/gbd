import { useGameStore } from "../stores/gameStore";

let rafId: number | null = null;

export function startGameLoop() {
  if (rafId !== null) return;

  function loop() {
    const now = performance.now();
    useGameStore.getState().tick(now);
    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);
}

export function stopGameLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}
