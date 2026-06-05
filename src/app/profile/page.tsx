"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";

const AVATAR_COLORS = [
  { name: "Gold", value: "#d4a843" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Red", value: "#ef4444" },
];

interface Profile {
  id: string;
  email: string;
  name: string;
  image: string | null;
  phone: string | null;
  avatarColor: string | null;
  profileComplete: boolean;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState("#d4a843");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch profile from DB
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data: Profile) => {
          setName(data.name || "");
          setPhone(data.phone || "");
          setImage(data.image || null);
          setAvatarColor(data.avatarColor || "#d4a843");
          setLoading(false);
        })
        .catch(() => {
          // If profile doesn't exist yet, use session data
          setName(session?.user?.name || "");
          setImage(session?.user?.image || null);
          setLoading(false);
        });
    }
  }, [status, router, session]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        // Resize to max 200x200
        const canvas = document.createElement("canvas");
        const maxSize = 200;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxSize) {
            h = (h * maxSize) / w;
            w = maxSize;
          }
        } else {
          if (h > maxSize) {
            w = (w * maxSize) / h;
            h = maxSize;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setImage(dataUrl);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone: phone || null,
        image,
        avatarColor,
        profileComplete: true,
      }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }

    setSaving(false);
  };

  if (status === "loading" || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Header />

      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--foreground)" }}
          >
            Your Profile
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            Tell us about yourself
          </p>

          {/* Avatar section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <Avatar
                image={image}
                name={name}
                color={avatarColor}
                size={120}
                className="ring-4"
                onClick={() => fileInputRef.current?.click()}
              />
              <div
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: "var(--gold)",
                  cursor: "pointer",
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0a0f1a"
                  strokeWidth="2.5"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium mb-4 transition-colors"
              style={{ color: "var(--gold)" }}
            >
              Upload photo
            </button>

            {/* Color picker */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs mr-1"
                style={{ color: "var(--muted)" }}
              >
                Avatar color:
              </span>
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setAvatarColor(c.value)}
                  className="w-6 h-6 rounded-full transition-transform"
                  style={{
                    backgroundColor: c.value,
                    border:
                      avatarColor === c.value
                        ? "2px solid white"
                        : "2px solid transparent",
                    transform:
                      avatarColor === c.value ? "scale(1.2)" : "scale(1)",
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "var(--navy-light)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--gold)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={session.user?.email || ""}
                readOnly
                className="w-full px-4 py-3 rounded-lg text-sm outline-none cursor-not-allowed"
                style={{
                  backgroundColor: "var(--navy)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                  opacity: 0.7,
                }}
              />
            </div>

            {/* Phone */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Phone{" "}
                <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "var(--navy-light)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--gold)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              />
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full mt-8 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor:
                saving || !name.trim()
                  ? "var(--navy-light)"
                  : "var(--gold)",
              color:
                saving || !name.trim()
                  ? "var(--muted)"
                  : "var(--background)",
              cursor: saving || !name.trim() ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Profile"}
          </button>
        </div>

        {/* Account section */}
        <div
          className="rounded-2xl p-5 mt-4"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: "var(--muted)" }}
          >
            Account
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                Email
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                {session.user?.email || "—"}
              </span>
            </div>
            {phone && (
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  Phone
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  {phone}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sign out - less prominent, at bottom */}
        <div className="mt-6 text-center">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm font-medium transition-colors px-4 py-2"
            style={{ color: "var(--muted)" }}
          >
            Sign out
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
