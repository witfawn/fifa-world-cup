// FIFA World Cup Trophy — Nano Banana 2 generated silhouette
import Image from "next/image";

export function FifaTrophy({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/trophy.png"
      alt="FIFA World Cup Trophy"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
      priority
    />
  );
}
