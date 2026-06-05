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

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/payment')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setPayment(data?.payment ?? null);
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
              <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>
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
              <p className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>
                Payment not yet confirmed
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Send payment via Venmo below — John will confirm you.
              </p>
            </div>
          </div>
        )}

        {/* Entry Fee */}
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
            <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
              Amount
            </span>
            <span
              className="text-3xl font-extrabold"
              style={{ color: 'var(--gold)' }}
            >
              ${ENTRY_FEE}
            </span>
          </div>

          {/* Venmo Button */}
          <a
            href={VENMO_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-6 py-3.5 rounded-xl text-sm font-bold transition-all"
            style={{
              backgroundColor: '#008CFF',
              color: '#fff',
            }}
          >
            Pay with Venmo →
          </a>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--muted)' }}>
            Opens Venmo with $100 pre-filled
          </p>
        </div>

        {/* Payout Table */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-4"
            style={{ color: 'var(--gold)' }}
          >
            🏆 Prize Pool
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            8 players × $100 = $800 pot
          </p>

          <div className="space-y-2">
            {[
              { place: '🥇 1st Place', pct: 60, amount: 480 },
              { place: '🥈 2nd Place', pct: 30, amount: 240 },
              { place: '🥉 3rd Place', pct: 10, amount: 80 },
            ].map((row) => (
              <div
                key={row.place}
                className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ backgroundColor: 'var(--navy-light)' }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  {row.place}
                </span>
                <div className="text-right">
                  <span
                    className="text-sm font-bold"
                    style={{ color: 'var(--gold)' }}
                  >
                    ${row.amount}
                  </span>
                  <span
                    className="text-xs ml-1.5"
                    style={{ color: 'var(--muted)' }}
                  >
                    ({row.pct}%)
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
          <div className="space-y-3 text-sm" style={{ color: 'var(--muted)' }}>
            <p>1. Tap <strong style={{ color: 'var(--foreground)' }}>Pay with Venmo</strong> above and send $100</p>
            <p>2. John will confirm your payment (usually within a day)</p>
            <p>3. Once confirmed, you&apos;re in the game!</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
