import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db/client';

// GET /api/subscriptions?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const result = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('next_billing_date', { ascending: true });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const subscriptions = (result.data || []).map((row: any) => ({
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

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

