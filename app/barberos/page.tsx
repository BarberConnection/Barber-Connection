import { createClient } from '../lib/supabase/server';
import { crearBarbero, desactivarBarbero } from '../actions';

export default async function BarberosPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from('shop_members')
    .select('shop_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const { data: barberos } = await supabase
    .from('barbers')
    .select('*')
    .eq('shop_id', membership?.shop_id)
    .eq('active', true)
    .order('full_name');

  return (
    <div style={{ maxWidth: 600, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Barberos</h1>
      <p><a href="/">← Volver</a></p>

      <form action={crearBarbero} style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Nombre completo</label>
          <input name="fullName" type="text" required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Cédula</label>
          <input name="identityNumber" type="text" required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Teléfono (opcional)</label>
          <input name="phone" type="tel" style={{ width: '100%', padding: 8 }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Agregar barbero</button>
      </form>

      <h2>Barberos activos</h2>
      {barberos && barberos.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {barberos.map((b) => (
            <li
              key={b.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #ddd',
              }}
            >
              <span>{b.full_name} — CC {b.identity_number}{b.phone ? ` — ${b.phone}` : ''}</span>
              <form action={desactivarBarbero}>
                <input type="hidden" name="id" value={b.id} />
                <button type="submit" style={{ color: 'red' }}>Desactivar</button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p>Todavía no has agregado ningún barbero.</p>
      )}
    </div>
  );
}