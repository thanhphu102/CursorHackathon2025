'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/auth-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  suggestedSavePerPeriod?: number;
}

export default function GoalsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: goalsData, isLoading } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/goals?userId=${user?.id}`);
      const data = await res.json();
      return data.goals || [];
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const goals: Goal[] = goalsData || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Financial Goals</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            + Create Goal
          </button>
        </div>

        {showAddForm && (
          <AddGoalForm
            userId={user?.id || ''}
            onSuccess={() => {
              setShowAddForm(false);
              queryClient.invalidateQueries({ queryKey: ['goals'] });
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">No goals yet. Create your first financial goal!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const daysRemaining = Math.ceil(
                (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              const remaining = goal.targetAmount - goal.currentAmount;

              return (
                <div key={goal.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">{goal.title}</h3>
                    <button
                      onClick={() => deleteMutation.mutate(goal.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium">
                        ${goal.currentAmount.toFixed(0)} / ${goal.targetAmount.toFixed(0)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-primary-600 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% complete</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deadline:</span>
                      <span className="font-medium">
                        {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days remaining:</span>
                      <span className="font-medium">{daysRemaining}</span>
                    </div>
                    {goal.suggestedSavePerPeriod && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Suggested savings:</span>
                        <span className="font-medium text-primary-600">
                          ${goal.suggestedSavePerPeriod.toFixed(2)}/period
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <p className="text-gray-600">
                        ${remaining.toFixed(2)} remaining to reach your goal
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function AddGoalForm({
  userId,
  onSuccess,
  onCancel,
}: {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title: formData.title,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        deadline: formData.deadline,
      }),
    });

    if (res.ok) {
      onSuccess();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to create goal');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Create New Goal</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Goal Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="e.g., Emergency Fund, Vacation, New Car"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target Amount</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Current Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.currentAmount}
              onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Deadline</label>
          <input
            type="date"
            required
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Create Goal
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

