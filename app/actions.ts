'use server';

import { createClient } from './lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const shopName = formData.get('shopName') as string;
  const headersList = await headers();
  const origin = headersList.get('origin');
    const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { shop_name: shopName },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    redirect(`/registro?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user && data.session) {
    await supabase.rpc('create_barbershop', { p_name: shopName });
    redirect('/');
  }

  redirect('/login?mensaje=Revisa tu correo para confirmar tu cuenta');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// funcion de catalogo de servicios

export async function crearServicio(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?causa=sin-usuario');

  const { data: membership } = await supabase
    .from('shop_members')
    .select('shop_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

   if (!membership) redirect('/login?causa=sin-membresia');

  const name = formData.get('name') as string;
  const priceText = formData.get('price') as string;
  const priceCop = parseInt(priceText, 10);

  await supabase.from('service_catalog').insert({
    shop_id: membership.shop_id,
    name,
    price_cop: priceCop,
  });

  redirect('/catalogo');
}

export async function desactivarServicio(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;

  await supabase
    .from('service_catalog')
    .update({ active: false })
    .eq('id', id);

  redirect('/catalogo');
}