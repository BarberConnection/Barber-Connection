import { supabase } from '../lib/supabase';

export default async function TestConexion() {
  const { data, error } = await supabase
    .from('barbershops')
    .select('*');

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Prueba de conexión con Supabase</h1>

      {error ? (
        <p style={{ color: 'red' }}>❌ Error: {error.message}</p>
      ) : (
        <>
          <p style={{ color: 'green' }}>✅ Conexión exitosa.</p>
          <p>Barberías encontradas: {data?.length ?? 0}</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </>
      )}
    </div>
  );
}