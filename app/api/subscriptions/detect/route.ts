import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db/client';
import { detectSubscriptions, candidatesToSubscriptions } from '@/lib/utils/subscription-detector';
import type { Transaction } from '@/types';

// GET /api/subscriptions/detect?userId=xxx
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
      .order('date', { ascending: true });

    if (transactionsResult.error) {
      return NextResponse.json(
        { error: transactionsResult.error.message },
        { status: 500 }
      );
    }

    // Transform to Transaction type
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

    // Run detection algorithm
    const candidates = detectSubscriptions(transactions);

    // Get existing subscriptions
    const existingSubsResult = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    const existingSubs = existingSubsResult.data || [];
    const existingServiceNames = new Set(
      existingSubs.map((sub: any) => sub.service_name.toLowerCase())
    );

    // Filter out already detected subscriptions and convert to Subscription objects
    const newSubscriptions = candidatesToSubscriptions(
      candidates.filter(
        (c) => !existingServiceNames.has(c.merchant.toLowerCase())
      ),
      userId
    );

    // Insert new subscriptions
    if (newSubscriptions.length > 0) {
      await supabase.from('subscriptions').insert(
        newSubscriptions.map((sub) => ({
          user_id: sub.userId,
          transaction_ids: sub.transactionIds,
          service_name: sub.serviceName,
          amount: sub.amount.toString(),
          currency: sub.currency,
          billing_cycle: sub.billingCycle,
          next_billing_date: new Date(sub.nextBillingDate).toISOString().split('T')[0],
          is_active: sub.isActive,
          is_snoozed: sub.isSnoozed || false,
        }))
      );
    }

    // Return all subscriptions
    const allSubsResult = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('next_billing_date', { ascending: true });

    const allSubs = (allSubsResult.data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      transactionIds: row.transaction_ids || [],
      serviceName: row.service_name,
      amount: parseFloat(row.amount),
      currency: row.currency,
      billingCycle: row.billing_cycle,
      nextBillingDate: row.next_billing_date,
      isActive: row.is_active,
      isSnoozed: row.is_snoozed,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      subscriptions: allSubs,
      detected: newSubscriptions.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to detect subscriptions' },
      { status: 500 }
    );
  }
}

