import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db/client';
import { aiAdapter } from '@/lib/ai/adapter';
import type { Transaction } from '@/types';

// GET /api/transactions?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Query transactions
    const result = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    // Transform to match Transaction type
    const transactions: Transaction[] = (result.data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: parseFloat(row.amount),
      currency: row.currency as Transaction['currency'],
      date: row.date,
      merchant: row.merchant,
      category: row.category as Transaction['category'],
      source: row.source as Transaction['source'],
      rawText: row.raw_text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ transactions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      amount,
      currency = 'USD',
      date,
      merchant,
      category,
      source = 'manual',
      rawText,
    } = body;

    if (!userId || !amount || !date || !merchant) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, date, merchant' },
        { status: 400 }
      );
    }

    // If category not provided, use AI to categorize
    let finalCategory = category;
    if (!finalCategory) {
      const categorization = await aiAdapter.categorizeTransaction(
        merchant,
        amount,
        rawText
      );
      finalCategory = categorization.category;
    }

    const supabase = getSupabaseClient();
    const result = await supabase.from('transactions').insert({
      user_id: userId,
      amount: amount.toString(),
      currency,
      date,
      merchant,
      category: finalCategory,
      source,
      raw_text: rawText,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const transaction = result.data?.[0];
    if (!transaction) {
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        userId: transaction.user_id,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency,
        date: transaction.date,
        merchant: transaction.merchant,
        category: transaction.category,
        source: transaction.source,
        rawText: transaction.raw_text,
        createdAt: transaction.created_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

