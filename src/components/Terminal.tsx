import { useCallback } from "react";
import { useGameStore } from "../stores/gameStore";

export function Terminal() {
  const input = useGameStore((s) => s.input);
  const currentBranch = useGameStore((s) => s.currentBranch);
  const gameState = useGameStore((s) => s.gameState);
  const appendInput = useGameStore((s) => s.appendInput);
  const backspace = useGameStore((s) => s.backspace);
  const submitCommand = useGameStore((s) => s.submitCommand);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (gameState !== "PLAYING" && gameState !== "BRANCH_INTRO") return;

      // IME 입력 중이면 무시
      if (e.nativeEvent.isComposing) return;

      if (e.key === "Enter") {
        submitCommand();
      } else if (e.key === "Backspace") {
        backspace();
      } else if (e.key === "Tab") {
        e.preventDefault();
        // TODO: 자동 완성 기능 (나중에)
      } else if (e.key.length === 1) {
        appendInput(e.key);
      }
    },
    [gameState, submitCommand, backspace, appendInput],
  );

  return (
    <div
      className="bg-black p-6 font-mono text-sm relative group cursor-text h-full"
      onClick={() => document.getElementById("term-input")?.focus()}
    >
      {/* 입력 라인 */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-blue-400">C:\Users\Branch\Defense</span>
        <span className="text-yellow-400">{currentBranch}</span>
        <span className="text-green-500">$</span>
        <span className="text-white whitespace-pre">{input}</span>
        <span className="w-2 h-4 bg-white animate-pulse" />
      </div>

      {/* 아이템 힌트 */}
      <div className="absolute bottom-4 right-4 text-[10px] text-gray-600">
        아이템 사용: git stash | git rebase
      </div>

      {/* 숨겨진 입력 필드 */}
      <input
        id="term-input"
        type="text"
        className="opacity-0 absolute inset-0 cursor-default"
        autoFocus
        onKeyDown={handleKeyDown}
        onChange={() => {}}
        value=""
      />
    </div>
  );
}
