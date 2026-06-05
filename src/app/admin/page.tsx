'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { ADMIN_EMAILS } from '@/lib/config';

type PaymentStatus = 'pending' | 'confirmed' | 'rejected';

interface AdminPayment {
  userId: string;
  name: string;
  email: string;
  paymentId: string | null;
  status: PaymentStatus | null;
  amount: number | null;
  venmoNote: string | null;
  createdAt: string | null;
  adminNotes: string | null;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const isAdmin =
    session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && isAdmin) {
      fetchPayments();
    }
  }, [status, router, isAdmin]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (
    userId: string,
    action: 'confirmed' | 'rejected'
  ) => {
    setUpdating(userId);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          status: action,
          adminNotes: adminNotes[userId] || null,
        }),
      });

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Payment ${action} successfully.`,
        });
        setAdminNotes((prev) => ({ ...prev, [userId]: '' }));
        await fetchPayments();
      } else {
        const err = await res.json().catch(() => null);
        setMessage({
          type: 'error',
          text: err?.error || 'Failed to update payment.',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setUpdating(null);
    }
  };

  const statusBadge = (s: PaymentStatus | null) => {
    const styles: Record<string, { bg: string; color: string; label: string }> =
      {
        pending: {
          bg: 'rgba(212, 168, 67, 0.15)',
          color: '#d4a843',
          label: '⏳ Pending',
        },
        confirmed: {
          bg: 'rgba(34, 197, 94, 0.15)',
          color: '#22c55e',
          label: '✓ Confirmed',
        },
        rejected: {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          label: '✗ Rejected',
        },
      };

    if (!s) {
      return (
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{
            backgroundColor: 'rgba(100, 100, 100, 0.15)',
            color: '#888',
          }}
        >
          No Payment
        </span>
      );
    }

    const style = styles[s];
    return (
      <span
        className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {style.label}
      </span>
    );
  };

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
            Manage payment confirmations for all users
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className="rounded-lg p-3 mb-4"
            style={{
              backgroundColor:
                message.type === 'success'
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            <p
              className="text-sm"
              style={{
                color: message.type === 'success' ? '#22c55e' : '#ef4444',
              }}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Summary */}
        <div
          className="rounded-2xl p-4 mb-4 flex gap-4 flex-wrap"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex-1 min-w-[100px] text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>
              {payments.length}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Total Users
            </p>
          </div>
          <div className="flex-1 min-w-[100px] text-center">
            <p className="text-2xl font-bold" style={{ color: '#d4a843' }}>
              {payments.filter((p) => p.status === 'pending').length}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Pending
            </p>
          </div>
          <div className="flex-1 min-w-[100px] text-center">
            <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
              {payments.filter((p) => p.status === 'confirmed').length}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Confirmed
            </p>
          </div>
          <div className="flex-1 min-w-[100px] text-center">
            <p className="text-2xl font-bold" style={{ color: '#888' }}>
              {payments.filter((p) => !p.status).length}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              No Payment
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

        {/* User Cards */}
        {payments.length === 0 ? (
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
          <div className="space-y-3">
            {/* Sort: pending first, then no payment, then confirmed/rejected */}
            {[...payments]
              .sort((a, b) => {
                const order: Record<string, number> = {
                  pending: 0,
                  null: 1,
                  confirmed: 2,
                  rejected: 3,
                };
                const aKey = a.status ?? 'null';
                const bKey = b.status ?? 'null';
                return (order[aKey] ?? 1) - (order[bKey] ?? 1);
              })
              .map((user) => (
                <div
                  key={user.userId}
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* User Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3
                        className="font-bold text-base"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {user.name || 'Unknown User'}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {user.email}
                      </p>
                    </div>
                    {statusBadge(user.status)}
                  </div>

                  {/* Payment Details */}
                  {user.paymentId && (
                    <div
                      className="rounded-lg p-3 mb-3 text-sm space-y-1"
                      style={{
                        backgroundColor: 'var(--navy-light, rgba(255,255,255,0.03))',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {user.amount != null && (
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--muted)' }}>Amount</span>
                          <span
                            className="font-bold"
                            style={{ color: 'var(--gold)' }}
                          >
                            ${user.amount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {user.venmoNote && (
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--muted)' }}>
                            Venmo Note
                          </span>
                          <span style={{ color: 'var(--foreground)' }}>
                            {user.venmoNote}
                          </span>
                        </div>
                      )}
                      {user.createdAt && (
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--muted)' }}>
                            Submitted
                          </span>
                          <span style={{ color: 'var(--foreground)' }}>
                            {new Date(user.createdAt).toLocaleDateString()}{' '}
                            {new Date(user.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                      {user.adminNotes && (
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--muted)' }}>
                            Admin Notes
                          </span>
                          <span style={{ color: 'var(--foreground)' }}>
                            {user.adminNotes}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions for pending payments */}
                  {user.status === 'pending' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={adminNotes[user.userId] || ''}
                        onChange={(e) =>
                          setAdminNotes((prev) => ({
                            ...prev,
                            [user.userId]: e.target.value,
                          }))
                        }
                        placeholder="Admin notes (optional)"
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                        style={{
                          backgroundColor:
                            'var(--navy-light, rgba(255,255,255,0.03))',
                          border: '1px solid var(--border)',
                          color: 'var(--foreground)',
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = 'var(--gold)')
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = 'var(--border)')
                        }
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(user.userId, 'confirmed')}
                          disabled={updating === user.userId}
                          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                          style={{
                            backgroundColor:
                              updating === user.userId
                                ? 'rgba(34, 197, 94, 0.3)'
                                : 'rgba(34, 197, 94, 0.15)',
                            color: '#22c55e',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            cursor:
                              updating === user.userId
                                ? 'not-allowed'
                                : 'pointer',
                          }}
                        >
                          {updating === user.userId
                            ? 'Updating...'
                            : '✓ Confirm'}
                        </button>
                        <button
                          onClick={() => handleUpdate(user.userId, 'rejected')}
                          disabled={updating === user.userId}
                          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                          style={{
                            backgroundColor:
                              updating === user.userId
                                ? 'rgba(239, 68, 68, 0.3)'
                                : 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            cursor:
                              updating === user.userId
                                ? 'not-allowed'
                                : 'pointer',
                          }}
                        >
                          {updating === user.userId
                            ? 'Updating...'
                            : '✗ Reject'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
