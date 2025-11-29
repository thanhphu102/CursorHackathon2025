import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db/client';

// PATCH /api/goals/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updateData: any = {};
    if (body.title) updateData.title = body.title;
    if (body.targetAmount !== undefined) updateData.target_amount = body.targetAmount.toString();
    if (body.currentAmount !== undefined) updateData.current_amount = body.currentAmount.toString();
    if (body.deadline) updateData.deadline = new Date(body.deadline).toISOString().split('T')[0];
    if (body.suggestedSavePerPeriod !== undefined) {
      updateData.suggested_save_per_period = body.suggestedSavePerPeriod.toString();
    }
    updateData.updated_at = new Date().toISOString();

    const supabase = getSupabaseClient();
    const result = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const supabase = getSupabaseClient();
    const result = await supabase.from('goals').delete().eq('id', id);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete goal' },
      { status: 500 }
    );
  }
}

