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
  const stroke = isActive ? colors.stroke : `${colors.stroke}44`;

  // transition-colors only: 위치/크기 속성에 transition 금지 (매 틱 변경되므로)
  const lineClass = clsx(
    "absolute w-1 transition-colors duration-300",
    isActive ? colors.active : colors.inactive,
  );

  return (
    <>
      {/* ── Main branch: full-height vertical line ── */}
      {branch === "main" && (
        <div
          className={lineClass}
          style={{ left: leftPosition, marginLeft: "-2px", top: 0, bottom: 0 }}
        />
      )}

      {/* ── Non-main branch ── */}
      {branch !== "main" && (
        <>
          {/*
            feature 직선: 분기점(originY)에서 위로 올라가는 선
            - originY 미설정: 전체 높이 (커밋 진입 전 레인 표시)
            - originY 설정: top=0 → originY% (분기점까지만 표시, 그 이상은 main)
            - mergeY 설정: top=0 → mergeY% (merge 지점에서 끝, 이후 스크롤 아웃)
          */}
          <div
            className={lineClass}
            style={{
              left: leftPosition,
              marginLeft: "-2px",
              top: 0,
              height: (() => {
                if (mergeY !== undefined)
                  return `${Math.min(mergeY, 100)}%`;
                if (originY !== undefined)
                  return `${Math.min(originY, 100)}%`;
                return "100%";
              })(),
            }}
          />

          {/*
            분기 커브: main → feature
            originY 위치에서 U자형 아치로 연결
            M 0 0 = main측 (originY%), C 0 1, 1 1 = 아래로 arch, 1 0 = feature측 (originY%)
          */}
          {originY !== undefined && parentLeft && (
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

          {/*
            머지 커브: feature → main
            mergeY 위치에서 U자형 아치로 역방향 연결
            M 1 0 = feature측 (mergeY%), C 1 1, 0 1 = 아래로 arch, 0 0 = main측 (mergeY%)
          */}
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

      {/* Branch label */}
      <span
        className={clsx(
          "absolute top-4 font-bold text-xs",
          isActive ? "opacity-100" : "opacity-50",
        )}
        style={{
          left: leftPosition,
          transform: "translateX(-50%)",
          color: colors.stroke,
        }}
      >
        {branch}
      </span>
    </>
  );
}
