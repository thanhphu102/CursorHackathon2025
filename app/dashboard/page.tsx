'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/auth-store';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

interface Insight {
  id: string;
  message: string;
  type: string;
}

interface Subscription {
  id: string;
  serviceName: string;
  amount: number;
  nextBillingDate: string;
}

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const { data: insightsData } = useQuery({
    queryKey: ['insights', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/insights?userId=${user?.id}`);
      const data = await res.json();
      setMetrics(data.metrics);
      return data.insights || [];
    },
    enabled: !!user?.id,
  });

  const { data: subscriptionsData } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions?userId=${user?.id}`);
      const data = await res.json();
      return data.subscriptions || [];
    },
    enabled: !!user?.id,
  });

  const { data: goalsData } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/goals?userId=${user?.id}`);
      const data = await res.json();
      return data.goals || [];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (user?.id) {
      // Trigger subscription detection
      fetch(`/api/subscriptions/detect?userId=${user.id}`);
    }
  }, [user?.id]);

  const insights: Insight[] = insightsData || [];
  const subscriptions: Subscription[] = subscriptionsData || [];
  const goals: Goal[] = goalsData || [];

  const totalMonthlySubscriptions = subscriptions.reduce(
    (sum, sub) => sum + (sub.nextBillingDate ? sub.amount : 0),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        {/* Balance & Spending Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Current Balance</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${metrics?.currentBalance?.toFixed(2) || '5,000.00'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              ${metrics?.currentMonthSpend?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Subscriptions</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              ${totalMonthlySubscriptions.toFixed(2)}/mo
            </p>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">🤖 AI Insights</h2>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight) => (
                <div
                  key={insight.id}
                  className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500"
                >
                  <p className="text-gray-800">{insight.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No insights yet. Add transactions to get started!</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/transactions"
            className="bg-white p-4 rounded-lg shadow text-center hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mb-2">💳</div>
            <div className="text-sm font-medium">Add Transaction</div>
          </Link>
          <Link
            href="/receipt"
            className="bg-white p-4 rounded-lg shadow text-center hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mb-2">📸</div>
            <div className="text-sm font-medium">Scan Receipt</div>
          </Link>
          <Link
            href="/goals"
            className="bg-white p-4 rounded-lg shadow text-center hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm font-medium">Create Goal</div>
          </Link>
          <Link
            href="/subscriptions"
            className="bg-white p-4 rounded-lg shadow text-center hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-sm font-medium">Subscriptions</div>
          </Link>
        </div>

        {/* Active Goals */}
        {goals.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🎯 Active Goals</h2>
            <div className="space-y-4">
              {goals.slice(0, 3).map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{goal.title}</span>
                      <span className="text-sm text-gray-600">
                        ${goal.currentAmount.toFixed(0)} / ${goal.targetAmount.toFixed(0)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Link
              href="/goals"
              className="mt-4 inline-block text-sm text-primary-600 hover:underline"
            >
              View all goals →
            </Link>
          </div>
        )}

        {/* Upcoming Subscriptions */}
        {subscriptions.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🔄 Upcoming Subscriptions</h2>
            <div className="space-y-3">
              {subscriptions.slice(0, 5).map((sub) => (
                <div key={sub.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{sub.serviceName}</p>
                    <p className="text-sm text-gray-600">
                      Next: {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-semibold">${sub.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <Link
              href="/subscriptions"
              className="mt-4 inline-block text-sm text-primary-600 hover:underline"
            >
              View all subscriptions →
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

