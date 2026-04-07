import React, { useState, useEffect, useRef } from 'react';
import { GitBranch, Play, RefreshCw, AlertCircle, CheckCircle2, Info } from 'lucide-react';

type GameState = 'START' | 'PLAYING' | 'TUTORIAL' | 'GAMEOVER' | 'SUCCESS';
type BranchName = 'main' | 'branch1';

interface CommitNode {
  id: number;
  targetBranch: BranchName;
  text: string;
  y: number; 
  isFixed?: boolean;
}

const CONFIG = {
  CANVAS_HEIGHT: 70,
  TERMINAL_HEIGHT: 30,
  SPEED: 0.025,  // 요청하신 0.025 고정 속도
  NEXT_DELAY: 500,
  PHASES: [
    { id: 0, targetBranch: 'main', text: 'git commit -m "commit"' },
    { id: 1, targetBranch: 'main', text: 'git commit -m "commit"' },
    { id: 2, targetBranch: 'branch1', text: 'git commit -m "commit"' },
  ] as Omit<CommitNode, 'y'>[]
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [currentBranch, setCurrentBranch] = useState<BranchName>('main');
  const [showBranch1, setShowBranch1] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [input, setInput] = useState('');
  
  const [activeCommit, setActiveCommit] = useState<CommitNode | null>(null);
  const [fixedCommits, setFixedCommits] = useState<CommitNode[]>([]);
  const [branchJY, setBranchJY] = useState<number | null>(null);

  const stateRefs = useRef({
    gameState: 'START' as GameState,
    activeCommit: null as CommitNode | null,
    branchJY: null as number | null
  });
  const gameLoopRef = useRef<number | null>(null);

  useEffect(() => {
    stateRefs.current = { gameState, activeCommit, branchJY };
  }, [gameState, activeCommit, branchJY]);

  const spawnCommit = (idx: number) => {
    if (idx >= CONFIG.PHASES.length) { 
      setGameState('SUCCESS'); 
      return; 
    }
    setActiveCommit({ ...CONFIG.PHASES[idx], y: 0 });
  };

  const startGame = () => {
    setGameState('PLAYING');
    setCurrentPhase(0);
    setShowBranch1(false);
    setCurrentBranch('main');
    setInput('');
    setFixedCommits([]);
    setBranchJY(null);
    spawnCommit(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (gameState !== 'PLAYING' && gameState !== 'TUTORIAL') return;

    if (e.key === 'Escape' && gameState === 'TUTORIAL') {
      setGameState('PLAYING');
      spawnCommit(2); 
      return;
    }

    if (e.key === 'Enter') {
      const val = input.trim();
      
      if (val.startsWith('git checkout ')) {
        const target = val.replace('git checkout ', '') as BranchName;
        if (target === 'main' || (target === 'branch1' && showBranch1)) {
          setCurrentBranch(target);
          if (gameState === 'TUTORIAL' && target === 'branch1') {
            setGameState('PLAYING');
            spawnCommit(2); 
          }
        }
      } 
      else if (activeCommit && val === activeCommit.text && currentBranch === activeCommit.targetBranch && gameState === 'PLAYING') {
        setFixedCommits(prev => [...prev, { ...activeCommit, isFixed: true }]);
        
        if (currentPhase === 0) {
          setShowBranch1(true);
          setBranchJY(activeCommit.y); 
        }
        
        setActiveCommit(null);
        const next = currentPhase + 1;
        setCurrentPhase(next);

        if (next === 2) {
          setTimeout(() => setGameState('TUTORIAL'), CONFIG.NEXT_DELAY);
        } else {
          setTimeout(() => spawnCommit(next), CONFIG.NEXT_DELAY);
        }
      }
      setInput('');
    } else if (e.key === 'Backspace') {
      setInput(p => p.slice(0, -1));
    } else if (e.key.length === 1) {
      setInput(p => p + e.key);
    }
  };

  function update() {
    const { gameState: currentState, activeCommit: currentActive, branchJY: currentBranchJY } = stateRefs.current;

    if (currentState === 'PLAYING') {
      setFixedCommits(prev => 
        prev.map(c => ({ ...c, y: c.y + CONFIG.SPEED }))
            .filter(c => c.y < 110) 
      );

      if (currentBranchJY !== null) {
        setBranchJY(prev => prev! + CONFIG.SPEED);
      }

      if (currentActive) {
        setActiveCommit(prev => {
          if (!prev) return null;
          const newY = prev.y + CONFIG.SPEED;
          if (newY > 95) { 
            setGameState('GAMEOVER'); 
            return null; 
          }
          return { ...prev, y: newY };
        });
      }
    }
    gameLoopRef.current = requestAnimationFrame(update);
  }

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(update);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, []);

  const getLeftPos = (branch: BranchName) => branch === 'main' ? 'calc(50% - 80px)' : 'calc(50% + 80px)';

  return (
    <div className="h-screen w-screen bg-[#0d1117] text-white flex flex-col font-mono overflow-hidden select-none">
      
      {/* --- 1. Canvas 영역 --- */}
      <div className="relative flex-grow overflow-hidden border-b border-gray-800" style={{ height: `${CONFIG.CANVAS_HEIGHT}%` }}>
        
        <style>
          {`
            @keyframes draw-curve-up {
              0% { stroke-dashoffset: 250; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes scale-up-y {
              0% { transform: scaleY(0); }
              100% { transform: scaleY(1); }
            }
          `}
        </style>

        <div className="absolute inset-0 w-full h-full">
          {/* Main Lane */}
          <div className={`absolute top-0 bottom-0 w-1 transition-all duration-700 ${currentBranch === 'main' ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]' : 'bg-blue-900 opacity-50'}`} 
               style={{ left: 'calc(50% - 80px)' }}></div>
          
          {/* ★ 핵심 수정: 완벽히 결합된 분기 컨테이너 */}
          {showBranch1 && branchJY !== null && (
            <div 
              className="absolute pointer-events-none"
              style={{
                left: 'calc(50% - 80px)',
                width: '164px',
                // 컨테이너의 맨 아래쪽(bottom)을 분기점(branchJY)에 완벽히 고정시킵니다.
                bottom: `calc(100% - ${branchJY}%)`, 
                top: '-1000px', // 위쪽으로 화면 밖까지 무한히 뻗어있는 구조
              }}
            >
              {/* 1단계: 곡선 (컨테이너 맨 아래에 고정) */}
              <svg className="absolute bottom-0 right-0" style={{ width: '164px', height: '100px' }}>
                <path 
                  d="M 2 100 C 2 40, 162 60, 162 0" 
                  fill="none" 
                  stroke={currentBranch === 'branch1' ? "#a855f7" : "#4c1d95"} 
                  strokeWidth="4" 
                  strokeDasharray="250" 
                  className="animate-[draw-curve-up_0.5s_ease-out_forwards]"
                />
              </svg>

              {/* 2단계: 직선 (곡선의 끝부분인 bottom 100px부터 컨테이너 끝까지 뻗음) */}
              <div className={`absolute right-0 w-1 transition-all duration-700 ${currentBranch === 'branch1' ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]' : 'bg-purple-900 opacity-50'}`} 
                   style={{ 
                     bottom: '100px', // 곡선 상단과 1픽셀의 오차 없이 결합
                     top: '0px', 
                     transformOrigin: 'bottom',
                     animation: 'scale-up-y 0.5s ease-out 0.5s forwards' 
                   }}>
              </div>
            </div>
          )}
        </div>

        <span className="absolute top-4 font-bold text-xs text-blue-400" style={{ left: 'calc(50% - 120px)' }}>main</span>
        {showBranch1 && <span className="absolute top-4 font-bold text-xs text-purple-400 animate-in fade-in duration-500 delay-1000" style={{ left: 'calc(50% + 95px)' }}>branch1</span>}

        {/* --- 커밋 렌더링 --- */}
        {fixedCommits.map((commit, idx) => (
          <div key={`${commit.id}-${idx}`} className="absolute flex flex-col items-center pointer-events-none"
               style={{ top: `${commit.y}%`, left: getLeftPos(commit.targetBranch), transform: `translate(-50%, -50%)` }}>
            <div className="w-5 h-5 rounded-full border-4 bg-green-500 border-green-200 flex justify-center items-center shadow-[0_0_10px_rgba(34,197,94,0.6)]">
              <CheckCircle2 size={12} className="text-white" />
            </div>
          </div>
        ))}

        {activeCommit && (
          <div className="absolute flex flex-col items-center pointer-events-none"
               style={{ top: `${activeCommit.y}%`, left: getLeftPos(activeCommit.targetBranch), transform: `translate(-50%, -50%)`, width: '180px' }}>
            <div className="w-6 h-6 rounded-full border-4 bg-gray-900 border-white/80 animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
            <div className="mt-2 bg-black/90 px-3 py-1.5 rounded-md text-[11px] border border-gray-500 shadow-xl whitespace-nowrap">
              {activeCommit.text}
            </div>
          </div>
        )}

        {/* --- 오버레이 UI --- */}
        {gameState === 'TUTORIAL' && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
             <div className="bg-[#1e293b] border border-blue-500/50 p-6 rounded-xl text-center shadow-2xl flex flex-col items-center max-w-sm relative">
                <div className="absolute top-2 right-3 text-[10px] text-gray-400 font-bold tracking-widest bg-black/50 px-2 py-1 rounded">
                  PRESS [ESC] TO SKIP
                </div>
                <Info size={40} className="text-blue-400 mb-4 animate-bounce mt-4" />
                <h2 className="text-xl font-bold text-white mb-2">신규 브랜치 감지됨!</h2>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  새 커밋이 <span className="text-purple-400 font-bold">branch1</span> 레인에서 내려옵니다.<br/>
                  터미널에 아래 명령어를 입력하여<br/>현재 위치(HEAD)를 이동하세요.
                </p>
                <div className="bg-black/50 px-4 py-2 rounded text-green-400 font-mono text-sm border border-gray-700 w-full mb-2 shadow-inner">
                  git checkout branch1
                </div>
                <p className="text-xs text-gray-500 mt-2">명령어를 입력하거나 ESC를 눌러 계속 진행</p>
             </div>
          </div>
        )}

        {gameState !== 'PLAYING' && gameState !== 'TUTORIAL' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60">
             <div className="bg-[#161b22] border border-gray-700 p-10 rounded-2xl text-center shadow-2xl flex flex-col items-center max-w-md">
                {gameState === 'START' && (
                  <>
                    <GitBranch size={56} className="text-blue-500 mb-6" />
                    <h1 className="text-3xl font-black mb-2 tracking-tighter">Git Branch Defense</h1>
                    <p className="text-gray-400 mb-8 text-sm">올바른 브랜치로 이동(checkout)하여 커밋을 성공시키세요.</p>
                    <button onClick={startGame} className="flex items-center gap-2 bg-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-500 transition-all">
                      <Play size={20} /> INITIALIZE GAME
                    </button>
                  </>
                )}
                {gameState === 'GAMEOVER' && (
                  <>
                    <AlertCircle size={56} className="text-red-500 mb-6" />
                    <h1 className="text-3xl font-black text-red-400 mb-2">Build Failed!</h1>
                    <button onClick={startGame} className="flex items-center gap-2 bg-red-600 px-8 py-3 rounded-lg font-bold hover:bg-red-500 transition-all">
                      <RefreshCw size={20} /> RETRY
                    </button>
                  </>
                )}
                {gameState === 'SUCCESS' && (
                  <>
                    <CheckCircle2 size={56} className="text-green-500 mb-6" />
                    <h1 className="text-3xl font-black text-green-400 mb-2">Deploy Success!</h1>
                    <button onClick={startGame} className="flex items-center gap-2 bg-green-600 px-8 py-3 rounded-lg font-bold hover:bg-green-500 transition-all">
                      <RefreshCw size={20} /> PLAY AGAIN
                    </button>
                  </>
                )}
             </div>
          </div>
        )}
      </div>

      <div className="bg-[#000000] p-6 font-mono text-sm relative group cursor-text" style={{ height: `${CONFIG.TERMINAL_HEIGHT}%` }}
           onClick={() => document.getElementById('term-input')?.focus()}>
        <div className="text-blue-400 mb-2">C:\Users\Branch\Defense <span className="text-yellow-400">({currentBranch})</span></div>
        <div className="flex gap-2 items-center">
          <span className="text-green-500">$</span>
          <span className="text-white whitespace-pre">{input}</span>
          <span className="w-2 h-4 bg-white animate-pulse"></span>
        </div>
        <input id="term-input" type="text" className="opacity-0 absolute inset-0 cursor-default" autoFocus onKeyDown={handleKeyDown} onChange={() => {}} value="" />
      </div>
    </div>
  );
}