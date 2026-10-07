import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  let role = 'admin';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (profile?.role) {
      role = profile.role;
    }
  }

  const isAuthPage = request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/signup' ||
      request.nextUrl.pathname.startsWith('/forgot-password') ||
      request.nextUrl.pathname.startsWith('/reset-password') ||
      request.nextUrl.pathname.startsWith('/auth') ||
      request.nextUrl.pathname === '/client-portal/login';

  // Redirect unauthenticated users trying to access protected routes
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    if (request.nextUrl.pathname.startsWith('/client-portal')) {
      url.pathname = '/client-portal/login';
    } else {
      url.pathname = '/login';
    }
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = role === 'client' ? '/client-portal' : '/dashboard';
    return NextResponse.redirect(url);
  }

  // Role-based routing protection
  if (user && request.nextUrl.pathname !== '/') {
    const isClientPortal = request.nextUrl.pathname.startsWith('/client-portal');
    
    if (role === 'client' && !isClientPortal) {
      const url = request.nextUrl.clone();
      url.pathname = '/client-portal';
      return NextResponse.redirect(url);
    }
    
    if (role === 'admin' && isClientPortal) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Redirect root to dashboard or client-portal
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    if (user) {
      url.pathname = role === 'client' ? '/client-portal' : '/dashboard';
    } else {
      url.pathname = '/login';
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
