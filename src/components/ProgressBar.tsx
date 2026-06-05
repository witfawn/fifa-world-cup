"use client";

interface ProgressBarProps {
  picked: number;
  total: number;
}

export default function ProgressBar({ picked, total }: ProgressBarProps) {
  const pct = total > 0 ? (picked / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
          Games picked
        </span>
        <span className="text-xs font-bold" style={{ color: "var(--gold)" }}>
          {picked}/{total}
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--navy-light)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: "var(--gold)",
          }}
        />
      </div>
    </div>
  );
}
