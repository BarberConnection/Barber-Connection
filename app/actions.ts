'use server';

import { createClient } from './lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getShopId } from './lib/shop';

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

// Pestaña de barberos

export async function crearBarbero(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('shop_members')
    .select('shop_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  if (!membership) redirect('/login');

  const fullName = formData.get('fullName') as string;
  const identityNumber = formData.get('identityNumber') as string;
  const phone = formData.get('phone') as string;

  await supabase.from('barbers').insert({
    shop_id: membership.shop_id,
    full_name: fullName,
    identity_number: identityNumber,
    phone: phone || null,
  });

  redirect('/barberos');
}

export async function desactivarBarbero(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;

  await supabase
    .from('barbers')
    .update({ active: false })
    .eq('id', id);

  redirect('/barberos');
}

// las comisiones de los barberos 

export async function guardarComisionGeneral(formData: FormData) {
  const { supabase, shopId } = await getShopId();

  const barberId = formData.get('barberId') as string;
  const rate = parseFloat(formData.get('rate') as string);

  if (isNaN(rate) || rate < 0 || rate > 100) {
    redirect('/comisiones?error=' + encodeURIComponent('La comisión debe estar entre 0 y 100'));
  }

  // Confirmamos que el barbero sea de tu barbería (RLS solo te deja ver los tuyos)
  const { data: barbero } = await supabase
    .from('barbers').select('id').eq('id', barberId).limit(1);
  if (!barbero || barbero.length === 0) {
    redirect('/comisiones?error=' + encodeURIComponent('Barbero no encontrado'));
  }

  const { data: existente } = await supabase
    .from('commission_rules')
    .select('id')
    .eq('barber_id', barberId)
    .is('service_id', null)
    .limit(1);

  if (existente && existente.length > 0) {
    await supabase.from('commission_rules').update({ rate }).eq('id', existente[0].id);
  } else {
    await supabase.from('commission_rules').insert({
      shop_id: shopId,
      barber_id: barberId,
      service_id: null,
      rate,
    });
  }

  redirect('/comisiones');
}

export async function guardarComisionServicio(formData: FormData) {
  const { supabase, shopId } = await getShopId();

  const barberId = formData.get('barberId') as string;
  const serviceId = formData.get('serviceId') as string;
  const rate = parseFloat(formData.get('rate') as string);

  if (isNaN(rate) || rate < 0 || rate > 100) {
    redirect('/comisiones?error=' + encodeURIComponent('La comisión debe estar entre 0 y 100'));
  }

  const { data: barbero } = await supabase
    .from('barbers').select('id').eq('id', barberId).limit(1);
  const { data: servicio } = await supabase
    .from('service_catalog').select('id').eq('id', serviceId).limit(1);

  if (!barbero?.length || !servicio?.length) {
    redirect('/comisiones?error=' + encodeURIComponent('Barbero o servicio no encontrado'));
  }

  await supabase.from('commission_rules').upsert(
    { shop_id: shopId, barber_id: barberId, service_id: serviceId, rate },
    { onConflict: 'barber_id,service_id' }
  );

  redirect('/comisiones');
}

export async function borrarComisionServicio(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;

  await supabase.from('commission_rules').delete().eq('id', id);

  redirect('/comisiones');
}


/// Los clientes 

export async function crearCliente(formData: FormData) {
  const { supabase, shopId } = await getShopId();

  const fullName = (formData.get('fullName') as string).trim();
  const identityNumber = (formData.get('identityNumber') as string).trim();
  const phone = (formData.get('phone') as string).trim();
  const birthDate = formData.get('birthDate') as string;

  const { error } = await supabase.from('clients').insert({
    shop_id: shopId,
    full_name: fullName,
    identity_number: identityNumber,
    phone: phone || null,
    birth_date: birthDate || null,
  });

  if (error) {
    // 23505 = violación de unicidad (misma cédula en la misma barbería)
    const mensaje =
      error.code === '23505'
        ? 'Ya existe un cliente con esa cédula'
        : 'No se pudo guardar el cliente';
    redirect('/clientes?error=' + encodeURIComponent(mensaje));
  }

  redirect('/clientes');
}

export async function desactivarCliente(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;

  await supabase.from('clients').update({ active: false }).eq('id', id);

  redirect('/clientes');
}


/// el control de ventas y comisiones (congelacón)
export async function registrarServicio(formData: FormData) {
  const { supabase } = await getShopId();

  const barberId = formData.get('barberId') as string;
  const clientId = (formData.get('clientId') as string) || null;
  const serviceIds = formData.getAll('serviceId') as string[];

  if (serviceIds.length === 0) {
    redirect('/servicios?error=' + encodeURIComponent('Elige al menos un servicio'));
  }

  const { error } = await supabase.rpc('register_sale', {
    p_barber_id: barberId,
    p_client_id: clientId,
    p_service_ids: serviceIds,
  });

  if (error) {
    redirect('/servicios?error=' + encodeURIComponent(error.message));
  }

  redirect('/servicios?ok=1');
}

export async function anularServicio(formData: FormData) {
  const { supabase } = await getShopId();

  const saleId = formData.get('saleId') as string;
  const reason = ((formData.get('reason') as string) || '').trim();

  if (!reason) {
    redirect('/servicios?error=' + encodeURIComponent('Escribe el motivo de la anulación'));
  }

  const { error } = await supabase.rpc('void_sale', {
    p_sale_id: saleId,
    p_reason: reason,
  });

  if (error) {
    redirect('/servicios?error=' + encodeURIComponent(error.message));
  }

  redirect('/servicios?ok=anulado');
}