'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { ADMIN_EMAILS } from '@/lib/config';

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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<UserPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const isAdmin =
    session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments');
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
    }
  }, [status, router, isAdmin, fetchPayments]);

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
      </main>

      <BottomNav />
    </div>
  );
}
