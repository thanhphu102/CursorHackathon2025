import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db/client';
import { aiAdapter } from '@/lib/ai/adapter';
import type { CSVImportRow, TransactionCategory } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { userId, rows } = await request.json();

    if (!userId || !rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: 'userId and rows array are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const transactions = [];

    for (const row of rows) {
      const { date, amount, merchant, category, description } = row as CSVImportRow;

      if (!date || !amount || !merchant) {
        continue; // Skip invalid rows
      }

      // Parse amount (handle negative/positive)
      const amountNum = parseFloat(String(amount).replace(/[^0-9.-]/g, ''));
      if (isNaN(amountNum)) continue;

      // Parse date
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) continue;

      // Categorize if not provided
      let finalCategory: TransactionCategory = category as TransactionCategory;
      if (!finalCategory) {
        const categorization = await aiAdapter.categorizeTransaction(
          merchant,
          amountNum,
          description
        );
        finalCategory = categorization.category;
      }

      // Insert transaction
      const result = await supabase.from('transactions').insert({
        user_id: userId,
        amount: amountNum.toString(),
        currency: 'USD',
        date: dateObj.toISOString().split('T')[0],
        merchant,
        category: finalCategory,
        source: 'csv',
        raw_text: description,
      });

      if (result.data?.[0]) {
        transactions.push(result.data[0]);
      }
    }

    return NextResponse.json({
      success: true,
      imported: transactions.length,
      transactions: transactions.map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        amount: parseFloat(t.amount),
        currency: t.currency,
        date: t.date,
        merchant: t.merchant,
        category: t.category,
        source: t.source,
        rawText: t.raw_text,
        createdAt: t.created_at,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to import transactions' },
      { status: 500 }
    );
  }
}

