import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const { email, password, demo } = await request.json();

    // Demo mode login
    if (demo || email === 'demo@example.com') {
      const supabase = getSupabaseClient();
      const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

      if (isDemoMode || !supabase.auth) {
        // In-memory demo user
        return NextResponse.json({
          user: {
            id: 'demo-user-123',
            email: 'demo@example.com',
            name: 'Demo User',
          },
          session: { access_token: 'demo-token' },
        });
      }
    }

    // Real Supabase auth
    const supabase = getSupabaseClient();
    if (supabase.auth) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }

      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Authentication not configured' },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

