import { createClient } from './supabase/server';
import { redirect } from 'next/navigation';

export async function getShopId() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('shop_members')
    .select('shop_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!membership) redirect('/login');

  return { supabase, shopId: membership.shop_id as string };
}