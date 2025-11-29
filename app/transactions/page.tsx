'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/auth-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  merchant: string;
  category: string;
  source: string;
}

export default function TransactionsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?userId=${user?.id}`);
      const data = await res.json();
      return data.transactions || [];
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const transactions: Transaction[] = transactionsData || [];
  const filteredTransactions =
    categoryFilter === 'all'
      ? transactions
      : transactions.filter((t) => t.category === categoryFilter);

  const categories = Array.from(new Set(transactions.map((t) => t.category)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <div className="flex gap-2">
            <Link
              href="/transactions/import"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Import CSV
            </Link>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              + Add Transaction
            </button>
          </div>
        </div>

        {showAddForm && (
          <AddTransactionForm
            userId={user?.id || ''}
            onSuccess={() => {
              setShowAddForm(false);
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found. Add your first transaction!
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-gray-50 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{transaction.merchant}</p>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {transaction.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.source}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p
                      className={`font-semibold ${
                        transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <button
                      onClick={() => deleteMutation.mutate(transaction.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
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

function AddTransactionForm({
  userId,
  onSuccess,
  onCancel,
}: {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        merchant: formData.merchant,
        amount: -Math.abs(parseFloat(formData.amount)), // Negative for expenses
        date: formData.date,
        category: formData.category || undefined,
        rawText: formData.description,
      }),
    });

    if (res.ok) {
      onSuccess();
    } else {
      alert('Failed to create transaction');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Add Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Merchant</label>
          <input
            type="text"
            required
            value={formData.merchant}
            onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category (optional)</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Auto-detect</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Others">Others</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description (optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Add Transaction
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

