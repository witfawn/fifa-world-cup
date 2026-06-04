// FIFA World Cup Trophy silhouette — simplified but recognizable
// Two figures spiraling up, holding a globe on top, with a base
export function FifaTrophy({ size = 18, color = "var(--gold)" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 28"
      fill="none"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Globe on top */}
      <circle cx="12" cy="5" r="3.5" />
      <path d="M8.5 5h7" />
      <path d="M12 1.5v7" />

      {/* Left figure spiraling up */}
      <path d="M7.5 13c0-2.5 1.5-4.5 4.5-5.5" />
      <path d="M6 16c1.5-1 3-2.5 3.5-4" />

      {/* Right figure spiraling up */}
      <path d="M16.5 13c0-2.5-1.5-4.5-4.5-5.5" />
      <path d="M18 16c-1.5-1-3-2.5-3.5-4" />

      {/* Base / stem */}
      <path d="M8 18c0 0 1 2 4 2s4-2 4-2" />

      {/* Pedestal */}
      <path d="M7 21h10l1 2H6l1-2z" />
      <path d="M6 24h12" />
    </svg>
  );
}
