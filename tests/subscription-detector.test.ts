import { describe, it, expect } from 'vitest';
import { detectSubscriptions } from '@/lib/utils/subscription-detector';
import type { Transaction } from '@/types';

describe('Subscription Detection', () => {
  it('should detect monthly subscriptions', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        userId: 'user1',
        amount: -15.99,
        currency: 'USD',
        date: '2024-01-05',
        merchant: 'Netflix',
        category: 'Entertainment',
        source: 'bank_feed',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'user1',
        amount: -15.99,
        currency: 'USD',
        date: '2024-02-05',
        merchant: 'Netflix',
        category: 'Entertainment',
        source: 'bank_feed',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        userId: 'user1',
        amount: -15.99,
        currency: 'USD',
        date: '2024-03-05',
        merchant: 'Netflix',
        category: 'Entertainment',
        source: 'bank_feed',
        createdAt: new Date().toISOString(),
      },
    ];

    const candidates = detectSubscriptions(transactions);
    expect(candidates.length).toBeGreaterThan(0);
    const netflix = candidates.find((c) => c.merchant === 'Netflix');
    expect(netflix).toBeDefined();
    expect(netflix?.cycle).toBe('monthly');
    expect(netflix?.confidence).toBeGreaterThan(0.7);
  });

  it('should not detect non-recurring transactions', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        userId: 'user1',
        amount: -50.0,
        currency: 'USD',
        date: '2024-01-05',
        merchant: 'Random Store',
        category: 'Shopping',
        source: 'manual',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'user1',
        amount: -75.0,
        currency: 'USD',
        date: '2024-03-15',
        merchant: 'Random Store',
        category: 'Shopping',
        source: 'manual',
        createdAt: new Date().toISOString(),
      },
    ];

    const candidates = detectSubscriptions(transactions);
    // Should not detect as subscription due to inconsistent amounts and dates
    expect(candidates.length).toBe(0);
  });

  it('should detect weekly subscriptions', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        userId: 'user1',
        amount: -10.0,
        currency: 'USD',
        date: '2024-01-01',
        merchant: 'Weekly Service',
        category: 'Bills',
        source: 'bank_feed',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'user1',
        amount: -10.0,
        currency: 'USD',
        date: '2024-01-08',
        merchant: 'Weekly Service',
        category: 'Bills',
        source: 'bank_feed',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        userId: 'user1',
        amount: -10.0,
        currency: 'USD',
        date: '2024-01-15',
        merchant: 'Weekly Service',
        category: 'Bills',
        source: 'bank_feed',
        createdAt: new Date().toISOString(),
      },
    ];

    const candidates = detectSubscriptions(transactions);
    const weekly = candidates.find((c) => c.merchant === 'Weekly Service');
    expect(weekly).toBeDefined();
    expect(weekly?.cycle).toBe('weekly');
  });

  it('should handle variations in amount within tolerance', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        userId: 'user1',
        amount: -15.99,
        currency: 'USD',
        date: '2024-01-05',
        merchant: 'Service',
        category: 'Bills',
        source: 'bank_feed',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'user1',
        amount: -16.05, // Small variation
        currency: 'USD',
        date: '2024-02-05',
        merchant: 'Service',
        category: 'Bills',
        source: 'bank_feed',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        userId: 'user1',
        amount: -15.95,
        currency: 'USD',
        date: '2024-03-05',
        merchant: 'Service',
        category: 'Bills',
        source: 'bank_feed',
        createdAt: new Date().toISOString(),
      },
    ];

    const candidates = detectSubscriptions(transactions);
    expect(candidates.length).toBeGreaterThan(0);
  });
});

