import { NextRequest, NextResponse } from 'next/server';
import { scanReceipt } from '@/lib/ocr/adapter';
import { getSupabaseClient } from '@/lib/db/client';
import { aiAdapter } from '@/lib/ai/adapter';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'file and userId are required' },
        { status: 400 }
      );
    }

    // Scan receipt with OCR
    const scanResult = await scanReceipt(file);

    // Categorize the transaction
    const categorization = await aiAdapter.categorizeTransaction(
      scanResult.merchant || 'Unknown',
      scanResult.total || 0,
      scanResult.rawText
    );

    // Create transaction from receipt
    const supabase = getSupabaseClient();
    const transactionResult = await supabase.from('transactions').insert({
      user_id: userId,
      amount: scanResult.total ? (-Math.abs(scanResult.total)).toString() : '0',
      currency: 'USD',
      date: scanResult.date ? new Date(scanResult.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      merchant: scanResult.merchant || 'Unknown',
      category: categorization.category,
      source: 'receipt',
      raw_text: scanResult.rawText,
    });

    if (transactionResult.error) {
      return NextResponse.json(
        { error: transactionResult.error.message },
        { status: 500 }
      );
    }

    const transaction = transactionResult.data?.[0];

    return NextResponse.json({
      success: true,
      scanResult,
      categorization,
      transaction: transaction ? {
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
      } : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to scan receipt' },
      { status: 500 }
    );
  }
}

