import { getShopId } from '../lib/shop';
import { crearCliente, desactivarCliente } from '../actions';

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { supabase, shopId } = await getShopId();

  const { data: clientes } = await supabase
    .from('clients')
    .select('*')
    .eq('shop_id', shopId)
    .eq('active', true)
    .order('full_name');

  return (
    <div style={{ maxWidth: 600, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Clientes</h1>
      <p><a href="/">← Volver</a></p>

      {params.error && <p style={{ color: 'red' }}>{params.error}</p>}

      <form action={crearCliente} style={{ marginBottom: '2rem' }}>
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
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Fecha de nacimiento (opcional)</label>
          <input name="birthDate" type="date" style={{ width: '100%', padding: 8 }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Agregar cliente</button>
      </form>

      <h2>Clientes activos</h2>
      {clientes && clientes.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {clientes.map((c) => (
            <li
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #ddd',
              }}
            >
              <span>
                {c.full_name} — CC {c.identity_number}
                {c.phone ? ` — ${c.phone}` : ''}
              </span>
              <form action={desactivarCliente}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" style={{ color: 'red' }}>Desactivar</button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p>Todavía no has agregado ningún cliente.</p>
      )}
    </div>
  );
}