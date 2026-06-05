"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FifaTrophy } from "@/components/FifaTrophy";
import Avatar from "@/components/Avatar";

interface Profile {
  id: string;
  name: string;
  image: string | null;
  avatarColor: string | null;
}

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data: Profile) => setProfile(data))
        .catch(() => {});
    }
  }, [session]);

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "var(--navy)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Trophy + name */}
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            <FifaTrophy size={28} />
          </div>
          <span
            className="font-semibold text-sm"
            style={{ color: "var(--foreground)" }}
          >
            Bangers WC 2026
          </span>
        </div>

        {/* Right: Avatar → profile */}
        <Avatar
          image={profile?.image ?? session?.user?.image ?? null}
          name={profile?.name ?? session?.user?.name ?? null}
          color={profile?.avatarColor ?? null}
          size={32}
          className="ring-2 ring-gray-700"
          onClick={() => router.push("/profile")}
        />
      </div>
    </header>
  );
}
