"use client";

interface GroupTabsProps {
  groups: string[];
  selected: string;
  onSelect: (group: string) => void;
}

export default function GroupTabs({
  groups,
  selected,
  onSelect,
}: GroupTabsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {groups.map((g) => {
        const isActive = g === selected;
        return (
          <button
            key={g}
            onClick={() => onSelect(g)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              backgroundColor: isActive ? "var(--gold)" : "var(--navy-light)",
              color: isActive ? "var(--background)" : "var(--muted)",
              border: `1px solid ${isActive ? "var(--gold)" : "var(--border)"}`,
            }}
          >
            {g}
          </button>
        );
      })}
    </div>
  );
}
