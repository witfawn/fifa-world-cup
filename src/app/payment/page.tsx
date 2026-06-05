'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { VENMO_LINK, ENTRY_FEE } from '@/lib/config';

type PaymentStatus = 'pending' | 'confirmed' | 'rejected' | null;

interface Payment {
  id: string;
  status: PaymentStatus;
}

function getPayoutTiers(playerCount: number) {
  const pot = playerCount * ENTRY_FEE;

  if (playerCount < 10) {
    return { pot, tiers: [{ place: '🥇 1st Place', pct: 100, amount: pot }] };
  }
  if (playerCount <= 15) {
    return {
      pot,
      tiers: [
        { place: '🥇 1st Place', pct: 70, amount: Math.round(pot * 0.7) },
        { place: '🥈 2nd Place', pct: 30, amount: Math.round(pot * 0.3) },
      ],
    };
  }
  if (playerCount <= 20) {
    return {
      pot,
      tiers: [
        { place: '🥇 1st Place', pct: 65, amount: Math.round(pot * 0.65) },
        { place: '🥈 2nd Place', pct: 25, amount: Math.round(pot * 0.25) },
        { place: '🥉 3rd Place', pct: 10, amount: Math.round(pot * 0.1) },
      ],
    };
  }
  return {
    pot,
    tiers: [
      { place: '🥇 1st Place', pct: 60, amount: Math.round(pot * 0.6) },
      { place: '🥈 2nd Place', pct: 25, amount: Math.round(pot * 0.25) },
      { place: '🥉 3rd Place', pct: 10, amount: Math.round(pot * 0.1) },
      { place: '4th Place', pct: 5, amount: Math.round(pot * 0.05) },
    ],
  };
}

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/payment').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/leaderboard').then((r) => (r.ok ? r.json() : null)),
      ])
        .then(([paymentData, lbData]) => {
          setPayment(paymentData?.payment ?? null);
          const count = lbData?.leaderboard?.length ?? 0;
          setPlayerCount(count || 8); // fallback to 8 if no data yet
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!session) return null;

  const isPaid = payment?.status === 'confirmed';
  const { pot, tiers } = getPayoutTiers(playerCount);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Status Banner */}
        {isPaid ? (
          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}
          >
            <span className="text-2xl">✅</span>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: '#22c55e' }}
              >
                You&apos;re all paid up!
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                You&apos;re in the game. Good luck!
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{
              backgroundColor: 'rgba(212, 168, 67, 0.08)',
              border: '1px solid rgba(212, 168, 67, 0.2)',
            }}
          >
            <span className="text-2xl">⏳</span>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--gold)' }}
              >
                Payment not yet confirmed
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Send payment via Venmo below — John will confirm you.
              </p>
            </div>
          </div>
        )}

        {/* Entry Fee + Venmo */}
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
            💰 Entry Fee
          </h1>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            Pay to join Bangers WC 2026
          </p>

          <div className="flex items-center justify-between mb-5">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--muted)' }}
            >
              Amount
            </span>
            <span
              className="text-3xl font-extrabold"
              style={{ color: 'var(--gold)' }}
            >
              ${ENTRY_FEE}
            </span>
          </div>

          <a
            href={VENMO_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-6 py-3.5 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: '#008CFF', color: '#fff' }}
          >
            Pay with Venmo →
          </a>
          <p
            className="text-xs text-center mt-2"
            style={{ color: 'var(--muted)' }}
          >
            Opens Venmo with $100 pre-filled
          </p>
        </div>

        {/* Prize Pool */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-1"
            style={{ color: 'var(--gold)' }}
          >
            🏆 Prize Pool
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            {playerCount} players × ${ENTRY_FEE} = ${pot.toLocaleString()} pot
          </p>

          <div className="space-y-2">
            {tiers.map((tier) => (
              <div
                key={tier.place}
                className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ backgroundColor: 'var(--navy-light)' }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  {tier.place}
                </span>
                <div className="text-right">
                  <span
                    className="text-sm font-bold"
                    style={{ color: 'var(--gold)' }}
                  >
                    ${tier.amount.toLocaleString()}
                  </span>
                  <span
                    className="text-xs ml-1.5"
                    style={{ color: 'var(--muted)' }}
                  >
                    ({tier.pct}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-3"
            style={{ color: 'var(--gold)' }}
          >
            How it works
          </h2>
          <div
            className="space-y-3 text-sm"
            style={{ color: 'var(--muted)' }}
          >
            <p>
              1. Tap{' '}
              <strong style={{ color: 'var(--foreground)' }}>
                Pay with Venmo
              </strong>{' '}
              above and send $100
            </p>
            <p>
              2. John will confirm your payment (usually within a day)
            </p>
            <p>
              3. Once confirmed, you&apos;re in the game!
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
