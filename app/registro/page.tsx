import { signup } from '../actions';

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Crear cuenta</h1>

      {params.error && <p style={{ color: 'red' }}>{params.error}</p>}

      <form action={signup}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Nombre de tu barbería</label>
          <input name="shopName" type="text" required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Correo</label>
          <input name="email" type="email" required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Contraseña</label>
          <input name="password" type="password" required minLength={6} style={{ width: '100%', padding: 8 }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Crear cuenta</button>
      </form>

      <p style={{ marginTop: '1rem' }}>
        ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
      </p>
    </div>
  );
}