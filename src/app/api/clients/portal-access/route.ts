import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Must use service role

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  try {
    const { clientId, email, name } = await request.json();

    if (!clientId || !email) {
      return NextResponse.json({ error: 'Client ID and Email are required' }, { status: 400 });
    }

    // 1. Create the user in Auth
    // We generate a random password, but they'll get a magic link or password reset
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: { name },
    });

    if (userError) {
      // If user already exists, it's fine, we can still link them
      if (userError.status !== 422) {
         throw userError;
      }
    }

    const authUserId = userData?.user?.id;

    // 2. Update the client record
    const { error: clientError } = await supabaseAdmin
      .from('clients')
      .update({ portal_access_email: email })
      .eq('id', clientId);

    if (clientError) throw clientError;

    // 3. Update the profile to make sure they are marked as 'client' and linked
    // The handle_new_user trigger might have already done this, but we ensure it here
    if (authUserId) {
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'client', client_id: clientId })
        .eq('user_id', authUserId);
    }

    // Send password reset email so they can set their password
    await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    return NextResponse.json({ success: true, message: 'Portal access granted and invite sent' });
  } catch (error: any) {
    console.error('Error enabling portal access:', error);
    return NextResponse.json({ error: error.message || 'Failed to enable portal access' }, { status: 500 });
  }
}
