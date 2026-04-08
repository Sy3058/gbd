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
  const lineClass = clsx(
    "absolute w-1 transition-all duration-700",
    isActive ? colors.active : colors.inactive,
  );

  return (
    <>
      {/* ── Main branch: full-height vertical line centered at leftPosition ── */}
      {branch === "main" && (
        <div
          className={lineClass}
          style={{ left: leftPosition, marginLeft: "-2px", top: 0, bottom: 0 }}
        />
      )}

      {/* ── Non-main branch ── */}
      {branch !== "main" && (
        <>
          {/* Vertical line — appears immediately when branch is activated.
              Height grows from top down to originY (the split point).
              Before the first commit on this branch, fills the full height. */}
          <div
            className={lineClass}
            style={{
              left: leftPosition,
              marginLeft: "-2px",
              top: 0,
              height: originY !== undefined ? `${originY}%` : "100%",
            }}
          />

          {/* Branch-start curve: only once the first commit establishes originY */}
          {originY !== undefined && parentLeft && (
            <svg
              className="absolute pointer-events-none overflow-visible"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              style={{
                left: parentLeft,
                width: `calc(${leftPosition} - ${parentLeft})`,
                top: `${Math.max(0, originY - 10)}%`,
                height: "10%",
              }}
            >
              <path
                d="M 0 1 C 0.5 1, 0.5 0, 1 0"
                fill="none"
                stroke={stroke}
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}

          {/* Merge curve: appears when a merge commit is processed */}
          {mergeY !== undefined && parentLeft && (
            <svg
              className="absolute pointer-events-none overflow-visible"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              style={{
                left: parentLeft,
                width: `calc(${leftPosition} - ${parentLeft})`,
                top: `${mergeY}%`,
                height: "10%",
              }}
            >
              <path
                d="M 1 0 C 0.5 0, 0.5 1, 0 1"
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
