import { clsx } from "clsx";
import type { BranchName } from "../types";

interface Props {
  branch: BranchName;
  isActive: boolean;
  leftPosition: string;
  originY?: number;
  parentLeft?: string;
  mergeY?: number;
}

const BRANCH_COLORS: Record<
  string,
  { active: string; inactive: string; stroke: string }
> = {
  main: {
    active: "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]",
    inactive: "bg-blue-900 opacity-50",
    stroke: "#3b82f6",
  },
  feature: {
    active: "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]",
    inactive: "bg-purple-900 opacity-50",
    stroke: "#a855f7",
  },
  hotfix: {
    active: "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]",
    inactive: "bg-red-900 opacity-50",
    stroke: "#ef4444",
  },
};

function getColors(branch: BranchName) {
  return BRANCH_COLORS[branch] ?? BRANCH_COLORS.feature;
}

export function BranchLane({
  branch,
  isActive,
  leftPosition,
  originY,
  parentLeft,
  mergeY,
}: Props) {
  const colors = getColors(branch);
  const isMerged = mergeY !== undefined;
  const stroke = isActive ? colors.stroke : `${colors.stroke}44`;

  const lineClass = clsx(
    "absolute w-1 transition-colors duration-300",
    isActive ? colors.active : colors.inactive,
  );

  /* ── 비-main 브랜치의 수직선 범위 계산 (렌더링 로직 분리) ── */
  // 1. 선이 시작되는 가장 윗부분 (머지 지점 또는 현재 화면 끝)
  const topEdge = mergeY !== undefined ? mergeY : 0;

  // 2. 선이 끝나는 가장 아랫부분 (분기 지점 또는 화면 밖 100%)
  // 화면을 뚫고 나가는 것을 방지하기 위해 여기서 미리 Math.min 처리
  const bottomEdge = originY !== undefined ? Math.min(originY, 100) : 100;

  // 3. 최종 선의 길이 (음수가 되지 않도록 방어)
  const lineHeight = Math.max(0, bottomEdge - topEdge);

  /* ── 라벨 시각화 로직 ── */
  const isLabelVisible =
    branch === "main" || (originY !== undefined && !isMerged);
  const labelOpacityClass = isLabelVisible
    ? isActive
      ? "opacity-100"
      : "opacity-50"
    : "opacity-0 pointer-events-none";

  return (
    <>
      {/* ── 1. Main branch: 항상 렌더링 ── */}
      {branch === "main" && (
        <div
          className={lineClass}
          style={{ left: leftPosition, marginLeft: "-2px", top: 0, bottom: 0 }}
        />
      )}

      {/* ── 2. Non-main branch ── */}
      {branch !== "main" && originY !== undefined && (
        <>
          <div
            className={lineClass}
            style={{
              left: leftPosition,
              marginLeft: "-2px",
              // 🔥 복잡한 수식이 사라지고 변수만 깔끔하게 주입됨
              top: `${topEdge}%`,
              height: `${lineHeight}%`,
            }}
          />

          {/* 분기 커브: 본선에서 떨어져 나오는 시점 (과거) */}
          {parentLeft && (
            <svg
              className="absolute pointer-events-none"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              style={{
                left: parentLeft,
                width: `calc(${leftPosition} - ${parentLeft})`,
                top: `${originY}%`,
                height: "10%",
                overflow: "visible",
              }}
            >
              <path
                d="M 0 0 C 0 1, 1 1, 1 0"
                fill="none"
                stroke={stroke}
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}

          {/* 머지 커브: 본선으로 합류하는 시점 (현재) */}
          {mergeY !== undefined && parentLeft && (
            <svg
              className="absolute pointer-events-none"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              style={{
                left: parentLeft,
                width: `calc(${leftPosition} - ${parentLeft})`,
                top: `${mergeY}%`,
                height: "10%",
                overflow: "visible",
              }}
            >
              <path
                d="M 1 0 C 1 1, 0 1, 0 0"
                fill="none"
                stroke={stroke}
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
        </>
      )}

      {/* ── 3. Branch Label (Screen-Space UI) ── */}
      <span
        className={clsx(
          "absolute font-bold text-xs transition-opacity duration-500",
          labelOpacityClass,
        )}
        style={{
          left: leftPosition,
          top: "16px",
          transform: "translateX(-50%)",
          color: colors.stroke,
        }}
      >
        {branch}
      </span>
    </>
  );
}
