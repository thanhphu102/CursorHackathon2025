import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db/client';
import { aiAdapter } from '@/lib/ai/adapter';

// GET /api/goals?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const result = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('deadline', { ascending: true });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const goals = (result.data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      targetAmount: parseFloat(row.target_amount),
      currentAmount: parseFloat(row.current_amount),
      currency: row.currency,
      startDate: row.start_date,
      deadline: row.deadline,
      suggestedSavePerPeriod: row.suggested_save_per_period
        ? parseFloat(row.suggested_save_per_period)
        : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ goals });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      title,
      targetAmount,
      currentAmount = 0,
      currency = 'USD',
      deadline,
    } = body;

    if (!userId || !title || !targetAmount || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, targetAmount, deadline' },
        { status: 400 }
      );
    }

    // Calculate suggested savings amount using AI
    const deadlineDate = new Date(deadline);
    const suggestion = await aiAdapter.suggestSavingsAmount(
      title,
      targetAmount,
      currentAmount,
      deadlineDate,
      5000, // TODO: Get from user profile
      2000, // TODO: Calculate from transactions
      5000 // TODO: Calculate from transactions
    );

    const supabase = getSupabaseClient();
    const result = await supabase.from('goals').insert({
      user_id: userId,
      title,
      target_amount: targetAmount.toString(),
      current_amount: currentAmount.toString(),
      currency,
      start_date: new Date().toISOString().split('T')[0],
      deadline: deadlineDate.toISOString().split('T')[0],
      suggested_save_per_period: suggestion.suggestedAmount.toString(),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const goal = result.data?.[0];
    if (!goal) {
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }

    return NextResponse.json({
      goal: {
        id: goal.id,
        userId: goal.user_id,
        title: goal.title,
        targetAmount: parseFloat(goal.target_amount),
        currentAmount: parseFloat(goal.current_amount),
        currency: goal.currency,
        startDate: goal.start_date,
        deadline: goal.deadline,
        suggestedSavePerPeriod: goal.suggested_save_per_period
          ? parseFloat(goal.suggested_save_per_period)
          : undefined,
        createdAt: goal.created_at,
      },
      suggestion,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create goal' },
      { status: 500 }
    );
  }
}

