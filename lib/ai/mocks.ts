// Mock AI responses for demo mode
import type { TransactionCategory, InsightType } from '@/types';

export function mockCategorizeTransaction(
  merchant: string,
  amount: number,
  description?: string
): TransactionCategory {
  // Deterministic categorization based on keywords
  const text = `${merchant} ${description || ''}`.toLowerCase();

  if (text.includes('restaurant') || text.includes('food') || text.includes('cafe') || 
      text.includes('grocery') || text.includes('market') || text.includes('delivery')) {
    return 'Food';
  }

  if (text.includes('uber') || text.includes('lyft') || text.includes('taxi') || 
      text.includes('gas') || text.includes('parking') || text.includes('metro') || 
      text.includes('train') || text.includes('bus')) {
    return 'Transport';
  }

  if (text.includes('amazon') || text.includes('store') || text.includes('shop') || 
      text.includes('mall') || text.includes('retail') || text.includes('clothing')) {
    return 'Shopping';
  }

  if (text.includes('electric') || text.includes('water') || text.includes('utility') || 
      text.includes('phone') || text.includes('internet') || text.includes('rent') || 
      text.includes('mortgage') || text.includes('insurance')) {
    return 'Bills';
  }

  if (text.includes('movie') || text.includes('cinema') || text.includes('concert') || 
      text.includes('game') || text.includes('streaming') || text.includes('netflix') || 
      text.includes('spotify')) {
    return 'Entertainment';
  }

  if (amount > 0) {
    return 'Income';
  }

  return 'Others';
}

export function mockGenerateInsights(
  currentMonthSpend: number,
  previousMonthSpend: number,
  categoryBreakdown: Record<string, number>,
  currentBalance: number
): Array<{ type: InsightType; message: string }> {
  const change = previousMonthSpend > 0 
    ? ((currentMonthSpend - previousMonthSpend) / previousMonthSpend) * 100 
    : 0;
  
  const insights: Array<{ type: InsightType; message: string }> = [];

  // Spending comparison
  if (Math.abs(change) > 5) {
    insights.push({
      type: 'spending_comparison',
      message: change > 0
        ? `You spent ${change.toFixed(1)}% more this month compared to last month. Total: $${currentMonthSpend.toFixed(2)} vs $${previousMonthSpend.toFixed(2)}.`
        : `Great job! You spent ${Math.abs(change).toFixed(1)}% less this month. Total: $${currentMonthSpend.toFixed(2)} vs $${previousMonthSpend.toFixed(2)}.`,
    });
  }

  // Category analysis
  const topCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0];
  if (topCategory && topCategory[1] > currentMonthSpend * 0.3) {
    insights.push({
      type: 'category_trend',
      message: `${topCategory[0]} is your largest spending category this month at $${topCategory[1].toFixed(2)} (${((topCategory[1] / currentMonthSpend) * 100).toFixed(0)}% of total spending).`,
    });
  }

  // Balance forecast
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const avgDailySpend = currentMonthSpend / currentDay;
  const projectedMonthEnd = currentMonthSpend + (avgDailySpend * (daysInMonth - currentDay));
  
  insights.push({
    type: 'balance_forecast',
    message: `Based on your current spending rate, you're projected to spend $${projectedMonthEnd.toFixed(2)} this month. Estimated end-of-month balance: $${(currentBalance - projectedMonthEnd).toFixed(2)}.`,
  });

  return insights;
}

export function mockSuggestSavingsAmount(
  targetAmount: number,
  currentAmount: number,
  daysRemaining: number,
  avgMonthlyIncome: number,
  avgMonthlySpend: number
): { suggestedAmount: number; reasoning: string } {
  const remaining = targetAmount - currentAmount;
  const monthsRemaining = daysRemaining / 30;
  const weeklyRemaining = daysRemaining / 7;

  const monthlySavings = remaining / Math.max(monthsRemaining, 0.5);
  const weeklySavings = remaining / Math.max(weeklyRemaining, 1);

  // Ensure savings is reasonable (not more than 50% of available income)
  const availableIncome = avgMonthlyIncome - avgMonthlySpend;
  const suggestedMonthly = Math.min(monthlySavings, availableIncome * 0.5);
  const suggestedWeekly = suggestedMonthly / 4;

  return {
    suggestedAmount: daysRemaining > 30 ? suggestedMonthly : suggestedWeekly,
    reasoning: daysRemaining > 30
      ? `Save $${suggestedMonthly.toFixed(2)} per month to reach your goal on time. This is ${((suggestedMonthly / availableIncome) * 100).toFixed(0)}% of your available income.`
      : `Save $${suggestedWeekly.toFixed(2)} per week to reach your goal on time.`,
  };
}

