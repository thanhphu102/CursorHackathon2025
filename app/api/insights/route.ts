import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db/client';
import { aiAdapter } from '@/lib/ai/adapter';
import type { Transaction } from '@/types';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// GET /api/insights?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Fetch all transactions
    const supabase = getSupabaseClient();
    const transactionsResult = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (transactionsResult.error) {
      return NextResponse.json(
        { error: transactionsResult.error.message },
        { status: 500 }
      );
    }

    const transactions: Transaction[] = (transactionsResult.data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      date: row.date,
      merchant: row.merchant,
      category: row.category,
      source: row.source,
      rawText: row.raw_text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Calculate spending metrics
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    const currentMonthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= currentMonthStart && t.amount < 0;
    });

    const previousMonthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= previousMonthStart && tDate <= previousMonthEnd && t.amount < 0;
    });

    const currentMonthSpend = Math.abs(
      currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0)
    );
    const previousMonthSpend = Math.abs(
      previousMonthTransactions.reduce((sum, t) => sum + t.amount, 0)
    );

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    currentMonthTransactions.forEach((t) => {
      const absAmount = Math.abs(t.amount);
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + absAmount;
    });

    // Get user balance (mock for now)
    const userResult = await supabase.from('users').select('balance').eq('id', userId);
    const currentBalance = userResult.data?.[0]?.balance || 5000;

    // Generate insights using AI
    const insights = await aiAdapter.generateInsights(
      currentMonthSpend,
      previousMonthSpend,
      categoryBreakdown,
      currentBalance
    );

    // Save insights to database
    if (insights.length > 0) {
      await supabase.from('insights').insert(
        insights.map((insight) => ({
          user_id: userId,
          type: insight.type,
          message: insight.message,
          metadata: insight.metadata || {},
        }))
      );
    }

    // Fetch recent insights from database
    const insightsResult = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const savedInsights = (insightsResult.data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      message: row.message,
      metadata: row.metadata,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      insights: savedInsights.length > 0 ? savedInsights : insights.map((insight, idx) => ({
        id: `temp-${idx}`,
        userId,
        ...insight,
        createdAt: new Date().toISOString(),
      })),
      metrics: {
        currentMonthSpend,
        previousMonthSpend,
        categoryBreakdown,
        currentBalance,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

