import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db/client';

// DELETE /api/transactions/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const supabase = getSupabaseClient();
    const result = await supabase.from('transactions').delete().eq('id', id);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}

