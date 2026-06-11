'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { ADMIN_EMAILS } from '@/lib/config';
import { getAllMatches } from '@/lib/schedule';
import { getTeamFlag } from '@/lib/teams';

interface PaymentRecord {
  id: string;
  status: string;
  amountCents: number | null;
  venmoNote: string | null;
  createdAt: string | null;
  adminNotes: string | null;
}

interface UserPayment {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  payment: PaymentRecord | null;
}

interface MatchResult {
  id: string;
  matchId: number;
  homeScore: number;
  awayScore: number;
  isLocked: boolean;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<UserPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Match results state
  const allMatches = getAllMatches();
  const [results, setResults] = useState<MatchResult[]>([]);
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({});
  const [savingMatch, setSavingMatch] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/results?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        setResults(json);
        // Pre-fill score inputs
        const map: Record<number, { home: string; away: string }> = {};
        for (const r of json as MatchResult[]) {
          map[r.matchId] = { home: String(r.homeScore), away: String(r.awayScore) };
        }
        setScores(map);
      }
    } catch {}
  }, []);

  const isAdmin =
    session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && isAdmin) {
      fetchPayments();
      fetchResults();
    }
  }, [status, router, isAdmin, fetchPayments, fetchResults]);

  const handleToggle = async (userId: string, currentlyPaid: boolean) => {
    setToggling(userId);
    try {
      if (currentlyPaid) {
        // Unpaid: delete the confirmed payment
        const item = data.find((d) => d.user.id === userId);
        if (item?.payment) {
          await fetch('/api/admin/payments', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: item.payment.id }),
          });
        }
      } else {
        // Paid: create or confirm a payment
        await fetch('/api/admin/payments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status: 'confirmed' }),
        });
      }
      await fetchPayments();
    } catch {
      // ignore
    } finally {
      setToggling(null);
    }
  };

  const paidCount = data.filter(
    (d) => d.payment?.status === 'confirmed'
  ).length;

  const handleSaveScore = async (matchId: number, lock: boolean) => {
    setSavingMatch(matchId);
    setSaveError(null);
    try {
      const s = scores[matchId] || { home: '0', away: '0' };
      const home = parseInt(s.home) || 0;
      const away = parseInt(s.away) || 0;
      const res = await fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, homeScore: home, awayScore: away, isLocked: lock }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Save failed' }));
        setSaveError(err.error || `HTTP ${res.status}`);
        return;
      }
      // Update local state directly instead of re-fetching
      setResults((prev) => {
        const existing = prev.find((r) => r.matchId === matchId);
        if (existing) {
          return prev.map((r) =>
            r.matchId === matchId ? { ...r, homeScore: home, awayScore: away, isLocked: lock } : r
          );
        }
        return [...prev, { id: crypto.randomUUID(), matchId, homeScore: home, awayScore: away, isLocked: lock, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
      });
      setScores((prev) => ({ ...prev, [matchId]: { home: String(home), away: String(away) } }));
    } catch {
      setSaveError('Network error');
    } finally {
      setSavingMatch(null);
    }
  };

  const getResult = (matchId: number) => results.find((r) => r.matchId === matchId);

  // Split matches into unlocked and locked
  const unlockedMatches = allMatches.filter((m) => {
    const r = getResult(m.id);
    return !r?.isLocked;
  });
  const lockedMatches = allMatches.filter((m) => {
    const r = getResult(m.id);
    return r?.isLocked;
  });

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{
            borderColor: 'var(--gold)',
            borderTopColor: 'transparent',
          }}
        />
      </div>
    );
  }

  if (!session) return null;

  if (!isAdmin) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-4xl mb-3">🚫</p>
            <h1
              className="text-xl font-bold mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              Access Denied
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              You do not have permission to access the admin panel.
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Page Title */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--foreground)' }}
          >
            ⚙️ Admin Panel
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Toggle payment status for each player
          </p>
        </div>

        {/* Summary */}
        <div
          className="rounded-2xl p-4 mb-4 flex gap-4"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>
              {data.length}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Players
            </p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
              {paidCount}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Paid
            </p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold" style={{ color: '#888' }}>
              {data.length - paidCount}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Unpaid
            </p>
          </div>
        </div>

        {/* Refresh */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={fetchPayments}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* User List */}
        {data.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No users found.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...data]
              .sort((a, b) => {
                const aPaid = a.payment?.status === 'confirmed' ? 1 : 0;
                const bPaid = b.payment?.status === 'confirmed' ? 1 : 0;
                return aPaid - bPaid; // unpaid first
              })
              .map((item) => {
                const isPaid = item.payment?.status === 'confirmed';
                const isToggling = toggling === item.user.id;

                return (
                  <div
                    key={item.user.id}
                    className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {/* Left: name + email */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-sm truncate"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {item.user.name || 'Unknown'}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: 'var(--muted)' }}
                      >
                        {item.user.email}
                      </p>
                    </div>

                    {/* Right: toggle */}
                    <button
                      onClick={() =>
                        handleToggle(item.user.id, isPaid)
                      }
                      disabled={isToggling}
                      className="relative flex-shrink-0 transition-colors duration-200"
                      style={{
                        width: 52,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: isPaid
                          ? '#22c55e'
                          : 'rgba(100,100,100,0.4)',
                        cursor: isToggling ? 'not-allowed' : 'pointer',
                        opacity: isToggling ? 0.5 : 1,
                        border: 'none',
                        padding: 0,
                      }}
                    >
                      <div
                        className="absolute top-0.5 transition-transform duration-200"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: '#fff',
                          transform: isPaid
                            ? 'translateX(26px)'
                            : 'translateX(2px)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }}
                      />
                    </button>
                  </div>
                );
              })}
          </div>
        )}

        {/* ==================== MATCH RESULTS ==================== */}
        <div className="mt-8 mb-4">
          <div
            className="rounded-2xl p-6 mb-4"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
              ⚽ Match Results
            </h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Enter scores and lock games to calculate leaderboard points
            </p>
            {saveError && (
              <p className="text-xs mt-2 font-bold" style={{ color: '#ef4444' }}>
                ⚠️ {saveError}
              </p>
            )}
          </div>

          {/* Unlocked matches — score entry */}
          <div className="space-y-2 mb-6">
            {unlockedMatches.map((match) => {
              const result = getResult(match.id);
              const s = scores[match.id] || { home: '', away: '' };
              const isSaving = savingMatch === match.id;

              return (
                <div
                  key={match.id}
                  className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  {/* Match header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--muted)' }}>
                      Group {match.group} · MD{match.matchday}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      {match.date} {match.time_pt}
                    </span>
                  </div>

                  {/* Teams + score inputs */}
                  <div className="flex items-center gap-2">
                    {/* Home */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-lg">{getTeamFlag(match.home)}</span>
                      <span className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>
                        {match.home.length > 10 ? match.home.split(' ').pop() : match.home}
                      </span>
                    </div>

                    {/* Score input */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={s.home}
                        onChange={(e) =>
                          setScores((prev) => ({ ...prev, [match.id]: { ...prev[match.id], home: e.target.value } }))
                        }
                        className="w-12 h-10 text-center text-lg font-bold rounded-lg"
                        style={{
                          backgroundColor: 'var(--navy-light)',
                          border: '1px solid var(--border)',
                          color: 'var(--foreground)',
                        }}
                      />
                      <span className="text-sm font-bold" style={{ color: 'var(--muted)' }}>—</span>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={s.away}
                        onChange={(e) =>
                          setScores((prev) => ({ ...prev, [match.id]: { ...prev[match.id], away: e.target.value } }))
                        }
                        className="w-12 h-10 text-center text-lg font-bold rounded-lg"
                        style={{
                          backgroundColor: 'var(--navy-light)',
                          border: '1px solid var(--border)',
                          color: 'var(--foreground)',
                        }}
                      />
                    </div>

                    {/* Away */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                      <span className="text-xs font-medium truncate text-right" style={{ color: 'var(--foreground)' }}>
                        {match.away.length > 10 ? match.away.split(' ').pop() : match.away}
                      </span>
                      <span className="text-lg">{getTeamFlag(match.away)}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleSaveScore(match.id, false)}
                      disabled={isSaving}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        backgroundColor: 'var(--navy-light)',
                        border: '1px solid var(--border)',
                        color: 'var(--muted)',
                        opacity: isSaving ? 0.5 : 1,
                      }}
                    >
                      {isSaving ? 'Saving...' : result ? '↻ Update Score' : '💾 Save Score'}
                    </button>
                    <button
                      onClick={() => handleSaveScore(match.id, true)}
                      disabled={isSaving}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        backgroundColor: '#22c55e',
                        color: '#fff',
                        opacity: isSaving ? 0.5 : 1,
                      }}
                    >
                      {isSaving ? 'Saving...' : '🔒 Lock Final'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Locked matches — read-only */}
          {lockedMatches.length > 0 && (
            <div>
              <h3
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--muted)' }}
              >
                🔒 Locked ({lockedMatches.length})
              </h3>
              <div className="space-y-2">
                {lockedMatches.map((match) => {
                  const s = scores[match.id] || { home: '?', away: '?' };
                  return (
                    <div
                      key={match.id}
                      className="rounded-xl px-4 py-2 flex items-center justify-between"
                      style={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        opacity: 0.7,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{getTeamFlag(match.home)}</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                          {match.home.length > 10 ? match.home.split(' ').pop() : match.home}
                        </span>
                      </div>
                      <span className="text-sm font-bold px-3" style={{ color: 'var(--gold)' }}>
                        {s.home} — {s.away}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-right" style={{ color: 'var(--foreground)' }}>
                          {match.away.length > 10 ? match.away.split(' ').pop() : match.away}
                        </span>
                        <span className="text-sm">{getTeamFlag(match.away)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
