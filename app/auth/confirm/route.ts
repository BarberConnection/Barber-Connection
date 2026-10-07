import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: membership } = await supabase
        .from('shop_members')
        .select('shop_id')
        .eq('user_id', data.user.id)
        .limit(1);

      if (!membership || membership.length === 0) {
        const shopName = data.user.user_metadata?.shop_name || 'Mi barbería';
        await supabase.rpc('create_barbershop', { p_name: shopName });
      }

      redirect('/');
    }
  }

  redirect('/login?error=El enlace de confirmación no es válido o ya expiró');
}