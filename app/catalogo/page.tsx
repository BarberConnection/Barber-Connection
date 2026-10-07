import { createClient } from '../lib/supabase/server';
import { crearServicio, desactivarServicio } from '../actions';

export default async function CatalogoPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from('shop_members')
    .select('shop_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const { data: servicios } = await supabase
    .from('service_catalog')
    .select('*')
    .eq('shop_id', membership?.shop_id)
    .eq('active', true)
    .order('name');

  return (
    <div style={{ maxWidth: 600, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Catálogo de servicios</h1>
      <p><a href="/">← Volver</a></p>

      <form action={crearServicio} style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Nombre del servicio</label>
          <input name="name" type="text" required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Precio (COP)</label>
          <input name="price" type="number" min="0" step="1000" required style={{ width: '100%', padding: 8 }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Agregar servicio</button>
      </form>

      <h2>Servicios activos</h2>
      {servicios && servicios.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {servicios.map((s) => (
            <li
              key={s.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #ddd',
              }}
            >
              <span>{s.name} — ${s.price_cop.toLocaleString('es-CO')}</span>
              <form action={desactivarServicio}>
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" style={{ color: 'red' }}>Desactivar</button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p>Todavía no has agregado ningún servicio.</p>
      )}
    </div>
  );
}