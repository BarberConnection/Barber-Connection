import { createClient } from './lib/supabase/server';
import { logout } from './actions';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div style={{ maxWidth: 600, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Barber Connection</h1>
      <p>Sesión iniciada como: <strong>{user?.email}</strong></p>

      <nav style={{ marginBottom: '1.5rem' }}>
        <a href="/catalogo">Ir al catálogo de servicios</a>
      </nav>

      <form action={logout}>
        <button type="submit" style={{ padding: '8px 16px' }}>Cerrar sesión</button>
      </form>
    </div>
  );
}



