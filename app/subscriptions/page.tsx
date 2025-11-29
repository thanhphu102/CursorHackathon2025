'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/auth-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Subscription {
  id: string;
  serviceName: string;
  amount: number;
  billingCycle: string;
  nextBillingDate: string;
  isSnoozed: boolean;
}

export default function SubscriptionsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [detecting, setDetecting] = useState(false);

  const { data: subscriptionsData, isLoading } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions?userId=${user?.id}`);
      const data = await res.json();
      return data.subscriptions || [];
    },
    enabled: !!user?.id,
  });

  const detectMutation = useMutation({
    mutationFn: async () => {
      setDetecting(true);
      const res = await fetch(`/api/subscriptions/detect?userId=${user?.id}`);
      if (!res.ok) throw new Error('Detection failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setDetecting(false);
    },
    onError: () => {
      setDetecting(false);
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({ id, snooze }: { id: string; snooze: boolean }) => {
      const res = await fetch(`/api/subscriptions/${id}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snooze }),
      });
      if (!res.ok) throw new Error('Failed to snooze');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const subscriptions: Subscription[] = subscriptionsData || [];
  const totalMonthly = subscriptions.reduce(
    (sum, sub) =>
      sum + (sub.billingCycle === 'monthly' ? sub.amount : sub.billingCycle === 'yearly' ? sub.amount / 12 : sub.amount * 4),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <button
            onClick={() => detectMutation.mutate()}
            disabled={detecting}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {detecting ? 'Detecting...' : '🔍 Detect Subscriptions'}
          </button>
        </div>

        {/* Summary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total Monthly Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">${totalMonthly.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Active Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{subscriptions.length}</p>
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">No subscriptions detected yet.</p>
            <button
              onClick={() => detectMutation.mutate()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Detect Subscriptions
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{sub.serviceName}</p>
                        {sub.isSnoozed && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                            Snoozed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        ${sub.amount.toFixed(2)} / {sub.billingCycle}
                      </p>
                      <p className="text-sm text-gray-500">
                        Next billing: {new Date(sub.nextBillingDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          snoozeMutation.mutate({ id: sub.id, snooze: !sub.isSnoozed })
                        }
                        className={`px-3 py-1 text-sm rounded ${
                          sub.isSnoozed
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-700'
                        } hover:bg-gray-200`}
                      >
                        {sub.isSnoozed ? 'Unsnooze' : 'Snooze'}
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(sub.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

