import { getShopId } from '../lib/shop';
import { registrarServicio, anularServicio } from '../actions';

type Venta = {
  id: string;
  registered_at: string;
  total_cop: number;
  status: string;
  liquidation_id: string | null;
  void_reason: string | null;
  barbers: { full_name: string } | null;
  clients: { full_name: string } | null;
  sale_items: { service_name: string; commission_cop: number }[];
};

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const { supabase, shopId } = await getShopId();

  const { data: barberos } = await supabase
    .from('barbers')
    .select('id, full_name')
    .eq('shop_id', shopId)
    .eq('active', true)
    .order('full_name');

  const { data: clientes } = await supabase
    .from('clients')
    .select('id, full_name')
    .eq('shop_id', shopId)
    .eq('active', true)
    .order('full_name');

  const { data: servicios } = await supabase
    .from('service_catalog')
    .select('id, name, price_cop')
    .eq('shop_id', shopId)
    .eq('active', true)
    .order('name');

  const { data: ventasRaw } = await supabase
    .from('sales')
.select(
      'id, registered_at, total_cop, status, liquidation_id, void_reason, barbers(full_name), clients(full_name), sale_items(service_name, commission_cop)'
    )
    .eq('shop_id', shopId)
    .order('registered_at', { ascending: false })
    .limit(10);
  const ventas = (ventasRaw ?? []) as unknown as Venta[];
  const faltanDatos =
    !barberos || barberos.length === 0 || !servicios || servicios.length === 0;

  return (
    <div style={{ maxWidth: 700, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Registrar servicio</h1>
      <p><a href="/">← Volver</a></p>

      {params.error && <p style={{ color: 'red' }}>{params.error}</p>}
            {params.ok && (
        <p style={{ color: 'green' }}>
          {params.ok === 'anulado' ? 'Servicio anulado.' : 'Servicio registrado.'}
        </p>
      )}

      {faltanDatos ? (
        <p>Necesitas al menos un barbero y un servicio en el catálogo para registrar ventas.</p>
      ) : (
        <form action={registrarServicio} style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label>Barbero</label>
            <select name="barberId" required style={{ width: '100%', padding: 8 }}>
              {barberos!.map((b) => (
                <option key={b.id} value={b.id}>{b.full_name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label>Cliente</label>
            <select name="clientId" style={{ width: '100%', padding: 8 }}>
              <option value="">Sin cliente registrado</option>
              {clientes?.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label>Servicios realizados</label>
            {servicios!.map((s) => (
              <div key={s.id}>
                <label>
                  <input type="checkbox" name="serviceId" value={s.id} />{' '}
                  {s.name} — ${s.price_cop.toLocaleString('es-CO')}
                </label>
              </div>
            ))}
          </div>

          <button type="submit" style={{ padding: '8px 16px' }}>Registrar servicio</button>
        </form>
      )}

      <h2>Últimos servicios</h2>
      {ventas && ventas.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {ventas.map((v) => {
            const comision = (v.sale_items ?? []).reduce(
              (suma: number, i: { commission_cop: number }) => suma + i.commission_cop,
              0
            );
            return (
              <li key={v.id} style={{ padding: '8px 0', borderBottom: '1px solid #ddd' }}>
                <div>
                  {new Date(v.registered_at).toLocaleString('es-CO', {
                    timeZone: 'America/Bogota',
                  })}
                  {v.status === 'voided' ? ' (anulado)' : ''}
                </div>
                <div>
                  {v.barbers?.full_name} · {v.clients?.full_name ?? 'Sin cliente'}
                </div>
                <div>
                  {(v.sale_items ?? [])
                    .map((i: { service_name: string }) => i.service_name)
                    .join(', ')}
                </div>
                <div>
                  Total: ${v.total_cop.toLocaleString('es-CO')} · Comisión: $
                  {comision.toLocaleString('es-CO')}
                </div>

                {v.status === 'voided' && v.void_reason && (
                  <div style={{ color: '#999' }}>Motivo: {v.void_reason}</div>
                )}
                {v.status === 'active' && !v.liquidation_id && (
                  <form action={anularServicio} style={{ marginTop: 4 }}>
                    <input type="hidden" name="saleId" value={v.id} />
                    <input
                      name="reason"
                      type="text"
                      required
                      placeholder="Motivo"
                      style={{ padding: 4 }}
                    />{' '}
                    <button type="submit" style={{ color: 'red' }}>Anular</button>
                  </form>
                )}

              </li>
            );
          })}
        </ul>
      ) : (
        <p>Todavía no hay servicios registrados.</p>
      )}
    </div>
  );
}