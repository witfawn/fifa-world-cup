// FIFA World Cup Trophy silhouette — faithful to the flowing-figure style
export function FifaTrophy({ size = 18, color = "var(--gold)" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 60"
      fill="none"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Globe with continents */}
      <circle cx="20" cy="11" r="8" />
      {/* Africa */}
      <path d="M22 7c1 1 2 3 1.5 5-.5 2-2 3-3 3.5" />
      {/* Europe hint */}
      <path d="M18 5.5c1-.5 2.5-.5 3.5.5" />
      {/* Americas hint */}
      <path d="M13 8c.5 1.5 1 3 .5 4.5" />

      {/* Left figure — arms up to globe, body spiraling down */}
      <path d="M11.5 18c.5-3 2-5 4-6.5" />
      <path d="M10 22c1-2 2.5-3.5 4-5" />
      <path d="M9 27c1-2 2.5-4 4.5-5.5" />
      <path d="M8.5 33c1.5-3 3-5.5 5.5-7" />

      {/* Right figure — mirrored */}
      <path d="M28.5 18c-.5-3-2-5-4-6.5" />
      <path d="M30 22c-1-2-2.5-3.5-4-5" />
      <path d="M31 27c-1-2-2.5-4-4.5-5.5" />
      <path d="M31.5 33c-1.5-3-3-5.5-5.5-7" />

      {/* Center spiral lines — figures' bodies blending */}
      <path d="M14 30c2-1 4-1 6 0" />
      <path d="M20 30c2 1 4 1 6 0" />
      <path d="M13 36c2.5-1 5-1 7.5 0" />
      <path d="M19.5 36c2.5 1 5 1 7.5 0" />

      {/* Stem narrowing */}
      <path d="M12 40c3-1 5.5-1.5 8-1.5s5 .5 8 1.5" />

      {/* Base / pedestal */}
      <path d="M11 43h18" />
      <path d="M10 46h20" />

      {/* Base bands */}
      <path d="M9.5 49h21" />
      <path d="M10 51.5h20" />
      <path d="M11 54h18" />
    </svg>
  );
}
