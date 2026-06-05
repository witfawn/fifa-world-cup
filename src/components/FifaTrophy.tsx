// FIFA World Cup Trophy — using the actual silhouette image
import Image from "next/image";

export function FifaTrophy({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/trophy.jpg"
      alt="FIFA World Cup Trophy"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
