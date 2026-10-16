import { getShopId } from '../lib/shop';
import {
  guardarComisionGeneral,
  guardarComisionServicio,
  borrarComisionServicio,
} from '../actions';

export default async function ComisionesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { supabase, shopId } = await getShopId();

  const { data: barberos } = await supabase
    .from('barbers')
    .select('id, full_name')
    .eq('shop_id', shopId)
    .eq('active', true)
    .order('full_name');

  const { data: servicios } = await supabase
    .from('service_catalog')
    .select('id, name')
    .eq('shop_id', shopId)
    .eq('active', true)
    .order('name');

  const { data: reglas } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('shop_id', shopId);

  return (
    <div style={{ maxWidth: 700, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Comisiones</h1>
      <p><a href="/">← Volver</a></p>

      {params.error && <p style={{ color: 'red' }}>{params.error}</p>}

      {(!barberos || barberos.length === 0) && (
        <p>Primero agrega al menos un barbero en la sección de barberos.</p>
      )}

      {barberos?.map((b) => {
        const general = reglas?.find((r) => r.barber_id === b.id && r.service_id === null);
        const excepciones = reglas?.filter((r) => r.barber_id === b.id && r.service_id !== null) ?? [];

        return (
          <div
            key={b.id}
            style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '1.5rem' }}
          >
            <h2 style={{ marginTop: 0 }}>{b.full_name}</h2>

            <form action={guardarComisionGeneral} style={{ marginBottom: '1rem' }}>
              <input type="hidden" name="barberId" value={b.id} />
              <label>Comisión general (%) </label>
              <input
                name="rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                defaultValue={general?.rate ?? ''}
                style={{ padding: 6, width: 90 }}
              />{' '}
              <button type="submit" style={{ padding: '6px 12px' }}>Guardar</button>
              {!general && <span style={{ color: '#999' }}> (sin definir)</span>}
            </form>

            <h3>Excepciones por servicio</h3>
            {excepciones.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {excepciones.map((r) => {
                  const servicio = servicios?.find((s) => s.id === r.service_id);
                  return (
                    <li
                      key={r.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <span>{servicio?.name ?? '(servicio inactivo)'} — {r.rate}%</span>
                      <form action={borrarComisionServicio}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" style={{ color: 'red' }}>Quitar</button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p style={{ color: '#999' }}>Ninguna: se usa la comisión general en todos sus servicios.</p>
            )}

            {servicios && servicios.length > 0 && (
              <form action={guardarComisionServicio}>
                <input type="hidden" name="barberId" value={b.id} />
                <select name="serviceId" required style={{ padding: 6 }}>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>{' '}
                <input
                  name="rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  placeholder="%"
                  style={{ padding: 6, width: 80 }}
                />{' '}
                <button type="submit" style={{ padding: '6px 12px' }}>Agregar excepción</button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}