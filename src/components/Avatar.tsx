"use client";

import Image from "next/image";

interface AvatarProps {
  image?: string | null;
  name?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export default function Avatar({
  image,
  name,
  color,
  size = 40,
  className = "",
  onClick,
}: AvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const bgColor = color || "#d4a843";

  if (image) {
    return (
      <div
        className={`relative rounded-full overflow-hidden ${className}`}
        style={{ width: size, height: size, cursor: onClick ? "pointer" : undefined }}
        onClick={onClick}
      >
        <Image
          src={image}
          alt={name || "Avatar"}
          width={size}
          height={size}
          className="rounded-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        color: "#fff",
        fontSize: size * 0.4,
        cursor: onClick ? "pointer" : undefined,
      }}
      onClick={onClick}
    >
      {initial}
    </div>
  );
}
