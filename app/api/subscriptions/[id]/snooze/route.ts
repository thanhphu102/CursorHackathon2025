import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { snooze } = await request.json();

    const supabase = getSupabaseClient();
    const result = await supabase
      .from('subscriptions')
      .update({ is_snoozed: snooze ?? true })
      .eq('id', id);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to snooze subscription' },
      { status: 500 }
    );
  }
}

