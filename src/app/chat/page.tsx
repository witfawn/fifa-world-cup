"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string | null;
  user_image: string | null;
  message: string;
  created_at: number;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUserId = (session?.user as { id: string })?.id ?? null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json);
        // Scroll to bottom after fetch
        setTimeout(scrollToBottom, 50);
      }
    } catch {}
  }, [scrollToBottom]);

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchMessages();
      setLoading(false);
    }
  }, [status, router, fetchMessages]);

  // Refresh on visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchMessages();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchMessages]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const text = input.trim();
    setInput("");
    setSending(true);

    // Optimistic: add message to UI immediately
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: currentUserId ?? "unknown",
      user_name: session?.user?.name ?? null,
      user_image: session?.user?.image ?? null,
      message: text,
      created_at: Math.floor(Date.now() / 1000),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setInput(text); // Restore input
        return;
      }

      // Replace optimistic with real response
      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMsg.id
            ? { ...m, id: data.id, created_at: data.created_at }
            : m
        )
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts * 1000);
    const now = new Date();
    const isToday =
      date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) return timeStr;

    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${dateStr}, ${timeStr}`;
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{
            borderColor: "var(--gold)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Header />

      {/* Chat header */}
      <div
        className="max-w-2xl mx-auto w-full px-4 py-3 border-b"
        style={{
          backgroundColor: "var(--navy)",
          borderColor: "var(--border)",
        }}
      >
        <h1
          className="text-lg font-bold"
          style={{ color: "var(--foreground)" }}
        >
          💬 Chat
        </h1>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          World Cup discussion
        </p>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No messages yet. Start the conversation!
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.user_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-end gap-2 max-w-[80%] ${
                    isMe ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar (other users only) */}
                  {!isMe && (
                    <Avatar
                      image={msg.user_image}
                      name={msg.user_name}
                      size={28}
                      className="flex-shrink-0"
                    />
                  )}

                  {/* Bubble */}
                  <div>
                    {/* Name (other users only) */}
                    {!isMe && (
                      <p
                        className="text-[10px] font-bold mb-1 ml-1"
                        style={{ color: "var(--gold)" }}
                      >
                        {msg.user_name ?? "Unknown"}
                      </p>
                    )}
                    <div
                      className="px-3 py-2 rounded-2xl"
                      style={{
                        backgroundColor: isMe
                          ? "var(--gold)"
                          : "var(--surface)",
                        border: isMe ? "none" : "1px solid var(--border)",
                        color: isMe ? "#000" : "var(--foreground)",
                        borderBottomRightRadius: isMe ? "4px" : undefined,
                        borderBottomLeftRadius: !isMe ? "4px" : undefined,
                      }}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>
                    {/* Timestamp */}
                    <p
                      className={`text-[9px] mt-0.5 ${
                        isMe ? "text-right mr-1" : "ml-1"
                      }`}
                      style={{ color: "var(--muted)" }}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div
        className="border-t px-4 py-3"
        style={{
          backgroundColor: "var(--navy)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-2xl mx-auto flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              backgroundColor: input.trim() ? "var(--gold)" : "var(--surface)",
              border: "1px solid var(--border)",
              opacity: !input.trim() || sending ? 0.5 : 1,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={input.trim() ? "#000" : "var(--muted)"}
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
