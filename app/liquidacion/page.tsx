import { getShopId } from '../lib/shop';
import { liquidarBarbero, revertirLiquidacion } from '../actions';

type Liquidacion = {
  id: string;
  cutoff_date: string;
  total_income_cop: number;
  commission_cop: number;
  status: string;
  settled_at: string;
  barbers: { full_name: string } | null;
};

type Pendiente = {
  barber_id: string;
  barber_name: string;
  sales_count: number;
  income_cop: number;
  commission_cop: number;
};


function pesos(n: number) {
  return '$' + n.toLocaleString('es-CO');
}

export default async function LiquidacionPage({
  searchParams,
}: {
  searchParams: Promise<{ corte?: string; error?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const { supabase, shopId } = await getShopId();

  // Hoy en Colombia, en formato AAAA-MM-DD
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  const corte =
    params.corte && /^\d{4}-\d{2}-\d{2}$/.test(params.corte) ? params.corte : hoy;

  const { data: pendientesRaw, error: errorPendientes } = await supabase.rpc(
    'pending_by_barber',
    { p_cutoff: corte }
  );
  const pendientes = (pendientesRaw ?? []) as Pendiente[];

  const { data: historialRaw } = await supabase
    .from('liquidations')
    .select(
      'id, cutoff_date, total_income_cop, commission_cop, status, settled_at, barbers(full_name)'
    )
    .eq('shop_id', shopId)
    .order('settled_at', { ascending: false })
    .limit(15);

      const historial = (historialRaw ?? []) as unknown as Liquidacion[];
  return (
    <div style={{ maxWidth: 700, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Liquidación</h1>
      <p><a href="/">← Volver</a></p>

      {params.error && <p style={{ color: 'red' }}>{params.error}</p>}
      {errorPendientes && (
        <p style={{ color: 'red' }}>No se pudo calcular: {errorPendientes.message}</p>
      )}
      {params.ok === 'liquidado' && <p style={{ color: 'green' }}>Liquidación registrada.</p>}
      {params.ok === 'revertida' && <p style={{ color: 'green' }}>Liquidación revertida.</p>}

      <form method="get" style={{ marginBottom: '1.5rem' }}>
        <label>Liquidar servicios hasta (inclusive): </label>
        <input name="corte" type="date" defaultValue={corte} required style={{ padding: 6 }} />{' '}
        <button type="submit" style={{ padding: '6px 12px' }}>Ver</button>
      </form>

      <h2>Pendiente por barbero</h2>
      {pendientes.length === 0 && <p>No hay barberos activos.</p>}
      {pendientes.map((p) => (
        <div
          key={p.barber_id}
          style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '1rem' }}
        >
          <h3 style={{ marginTop: 0 }}>{p.barber_name}</h3>
          {p.sales_count > 0 ? (
            <>
              <div>Servicios pendientes: {p.sales_count}</div>
              <div>Ingresos generados: {pesos(p.income_cop)}</div>
              <div>
                <strong>Comisión a pagar: {pesos(p.commission_cop)}</strong>
              </div>
              <form action={liquidarBarbero} style={{ marginTop: '0.75rem' }}>
                <input type="hidden" name="barberId" value={p.barber_id} />
                <input type="hidden" name="cutoff" value={corte} />
                <input type="hidden" name="expected" value={p.commission_cop} />
                <label>
                  <input type="checkbox" required /> Confirmo que voy a liquidar{' '}
                  {pesos(p.commission_cop)} a {p.barber_name}
                </label>
                <div style={{ marginTop: 6 }}>
                  <button type="submit" style={{ padding: '6px 12px' }}>Liquidar</button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ color: '#999' }}>Sin servicios pendientes hasta esa fecha.</div>
          )}
        </div>
      ))}

      <h2>Historial</h2>
      {historial && historial.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {historial.map((h) => (
            <li key={h.id} style={{ padding: '8px 0', borderBottom: '1px solid #ddd' }}>
              <div>
                {h.barbers?.full_name} · hasta {h.cutoff_date}
                {h.status === 'reverted' ? ' (revertida)' : ''}
              </div>
              <div>
                Ingresos {pesos(h.total_income_cop)} · Comisión {pesos(h.commission_cop)}
              </div>
              <div style={{ color: '#999' }}>
                {new Date(h.settled_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
              </div>
              {h.status === 'settled' && (
                <form action={revertirLiquidacion} style={{ marginTop: 4 }}>
                  <input type="hidden" name="id" value={h.id} />
                  <label>
                    <input type="checkbox" required /> Confirmo revertir
                  </label>{' '}
                  <button type="submit" style={{ color: 'red' }}>Revertir</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>Todavía no hay liquidaciones.</p>
      )}
    </div>
  );
}