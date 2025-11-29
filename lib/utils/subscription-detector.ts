// Subscription detection algorithm
import type { Transaction, Subscription, BillingCycle } from '@/types';

export interface SubscriptionCandidate {
  merchant: string;
  transactions: Transaction[];
  averageAmount: number;
  cycle: BillingCycle;
  confidence: number;
  reasoning: string;
}

/**
 * Detects recurring subscriptions from transactions using heuristics:
 * - Same merchant name (normalized)
 * - Similar amounts (±10% tolerance)
 * - Regular intervals (monthly, weekly, yearly)
 */
export function detectSubscriptions(
  transactions: Transaction[]
): SubscriptionCandidate[] {
  // Filter out income transactions and group by merchant
  const expenseTransactions = transactions.filter((t) => t.amount < 0);
  
  // Normalize merchant names (lowercase, remove common prefixes/suffixes)
  const normalizeMerchant = (merchant: string): string => {
    return merchant
      .toLowerCase()
      .replace(/^(the|a|an)\s+/i, '')
      .replace(/\s+(inc|llc|corp|ltd|llp)\.?$/i, '')
      .trim();
  };

  // Group transactions by normalized merchant
  const merchantGroups = new Map<string, Transaction[]>();
  
  for (const transaction of expenseTransactions) {
    const normalized = normalizeMerchant(transaction.merchant);
    if (!merchantGroups.has(normalized)) {
      merchantGroups.set(normalized, []);
    }
    merchantGroups.get(normalized)!.push(transaction);
  }

  const candidates: SubscriptionCandidate[] = [];

  // Analyze each merchant group
  for (const [merchant, groupTransactions] of merchantGroups) {
    // Need at least 2 transactions to detect a pattern
    if (groupTransactions.length < 2) continue;

    // Sort by date
    const sorted = [...groupTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate average amount
    const amounts = sorted.map((t) => Math.abs(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length
    );

    // Check if amounts are consistent (±15% tolerance)
    const isConsistentAmount = stdDev / avgAmount < 0.15;

    if (!isConsistentAmount) continue;

    // Detect billing cycle by analyzing intervals
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days = Math.floor(
        (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      intervals.push(days);
    }

    // Calculate average interval
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Determine cycle
    let cycle: BillingCycle;
    let cycleConfidence = 0;

    if (avgInterval >= 25 && avgInterval <= 35) {
      cycle = 'monthly';
      cycleConfidence = 0.9;
    } else if (avgInterval >= 6 && avgInterval <= 8) {
      cycle = 'weekly';
      cycleConfidence = 0.85;
    } else if (avgInterval >= 350 && avgInterval <= 380) {
      cycle = 'yearly';
      cycleConfidence = 0.9;
    } else {
      // Not a clear cycle, skip
      continue;
    }

    // Check interval consistency
    const intervalStdDev = Math.sqrt(
      intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) /
        intervals.length
    );

    const isRegularInterval = intervalStdDev / avgInterval < 0.2;

    if (!isRegularInterval) continue;

    // Calculate overall confidence
    const confidence = Math.min(
      0.95,
      (cycleConfidence * 0.5) + 
      (isConsistentAmount ? 0.3 : 0) + 
      (isRegularInterval ? 0.2 : 0) +
      (sorted.length >= 3 ? 0.1 : 0) - 
      (sorted.length === 2 ? 0.1 : 0)
    );

    if (confidence < 0.6) continue;

    // Calculate next billing date
    const lastTransaction = sorted[sorted.length - 1];
    const lastDate = new Date(lastTransaction.date);
    const daysToAdd = cycle === 'monthly' ? 30 : cycle === 'weekly' ? 7 : 365;
    const nextBillingDate = new Date(lastDate);
    nextBillingDate.setDate(nextBillingDate.getDate() + daysToAdd);

    candidates.push({
      merchant: sorted[0].merchant, // Use original merchant name
      transactions: sorted,
      averageAmount: avgAmount,
      cycle,
      confidence,
      reasoning: `Detected ${cycle} recurring charge from ${sorted.length} transactions. Average amount: $${avgAmount.toFixed(2)}.`,
    });
  }

  // Sort by confidence descending
  return candidates.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Convert subscription candidates to Subscription objects
 */
export function candidatesToSubscriptions(
  candidates: SubscriptionCandidate[],
  userId: string
): Omit<Subscription, 'id' | 'createdAt'>[] {
  return candidates.map((candidate) => ({
    userId,
    transactionIds: candidate.transactions.map((t) => t.id),
    serviceName: candidate.merchant,
    amount: candidate.averageAmount,
    currency: candidate.transactions[0]?.currency || 'USD',
    billingCycle: candidate.cycle,
    nextBillingDate: (() => {
      const lastTransaction = candidate.transactions[candidate.transactions.length - 1];
      const lastDate = new Date(lastTransaction.date);
      const daysToAdd =
        candidate.cycle === 'monthly' ? 30 : candidate.cycle === 'weekly' ? 7 : 365;
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      return nextDate;
    })(),
    isActive: true,
    isSnoozed: false,
  }));
}

