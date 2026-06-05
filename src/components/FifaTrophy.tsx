// FIFA World Cup Trophy silhouette — simple, clean, recognizable
export function FifaTrophy({ size = 18, color = "var(--gold)" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Globe on top */}
      <circle cx="12" cy="5" r="3" />
      <path d="M9 5h6" />
      <path d="M12 2v6" />

      {/* Figures spiraling up */}
      <path d="M8 14c0-3 1.5-5 4-6.5" />
      <path d="M16 14c0-3-1.5-5-4-6.5" />

      {/* Base */}
      <path d="M8 17c0 0 1.5 2 4 2s4-2 4-2" />
      <path d="M7 20h10l1 2H6l1-2z" />
      <path d="M6 23h12" />
    </svg>
  );
}
