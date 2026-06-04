"use client";

import Image from "next/image";
import { useState } from "react";

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
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const bgColor = color || "#d4a843";

  // Show initial avatar if no image or image failed to load
  if (!image || imgError) {
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
        onError={() => setImgError(true)}
      />
    </div>
  );
}
