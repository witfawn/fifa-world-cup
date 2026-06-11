"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { FifaTrophy } from "@/components/FifaTrophy";
import Avatar from "@/components/Avatar";
import { ADMIN_EMAILS } from "@/lib/config";

interface Profile {
  id: string;
  name: string;
  image: string | null;
  avatarColor: string | null;
}

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "var(--gold)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/predict",
    label: "Predict",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "var(--gold)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    ),
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "var(--gold)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
  {
    href: "/rules",
    label: "How to Play",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "var(--gold)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "var(--gold)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAdmin =
    session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data: Profile) => setProfile(data))
        .catch(() => {});
    }
  }, [session]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleNav = useCallback((href: string) => {
    setDrawerOpen(false);
    router.push(href);
  }, [router]);

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "var(--navy)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Hamburger + Trophy + name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="p-1 -ml-1 rounded-lg transition-colors"
              style={{ color: "var(--foreground)" }}
              aria-label="Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {drawerOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
            <div className="flex-shrink-0">
              <FifaTrophy size={24} />
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

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60]"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 left-0 h-full z-[70] transition-transform duration-200 ease-out"
        style={{
          width: 260,
          backgroundColor: "var(--navy)",
          borderRight: "1px solid var(--border)",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* Drawer header */}
        <div
          className="px-5 py-4 border-b flex items-center gap-3"
          style={{ borderColor: "var(--border)" }}
        >
          <FifaTrophy size={24} />
          <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
            Bangers WC 2026
          </span>
        </div>

        {/* Nav items */}
        <nav className="py-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className="w-full flex items-center gap-3 px-5 py-3 transition-colors text-left"
                style={{
                  color: isActive ? "var(--gold)" : "var(--muted)",
                  backgroundColor: isActive ? "rgba(212, 168, 67, 0.08)" : "transparent",
                }}
              >
                {item.icon(isActive)}
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Admin-only: Chat — between navItems and Admin */}
          {isAdmin && (
            <button
              onClick={() => handleNav("/chat")}
              className="w-full flex items-center gap-3 px-5 py-3 transition-colors text-left"
              style={{
                color: pathname === "/chat" ? "var(--gold)" : "var(--muted)",
                backgroundColor: pathname === "/chat" ? "rgba(212, 168, 67, 0.08)" : "transparent",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={pathname === "/chat" ? "var(--gold)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-sm font-medium">Chat</span>
            </button>
          )}

          {/* Admin — only visible to admin emails */}
          {isAdmin && (
            <>
              <div
                className="mx-5 my-2 border-t"
                style={{ borderColor: "var(--border)" }}
              />
              <button
                onClick={() => handleNav("/admin")}
                className="w-full flex items-center gap-3 px-5 py-3 transition-colors text-left"
                style={{
                  color: pathname === "/admin" ? "var(--gold)" : "var(--muted)",
                  backgroundColor: pathname === "/admin" ? "rgba(212, 168, 67, 0.08)" : "transparent",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={pathname === "/admin" ? "var(--gold)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="text-sm font-medium">Admin</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
