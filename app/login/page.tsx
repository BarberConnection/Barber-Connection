import { login } from '../actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mensaje?: string }>;
}) {
  const params = await searchParams;

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Iniciar sesión</h1>

      {params.mensaje && <p style={{ color: 'green' }}>{params.mensaje}</p>}
      {params.error && <p style={{ color: 'red' }}>{params.error}</p>}

      <form action={login}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Correo</label>
          <input name="email" type="email" required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Contraseña</label>
          <input name="password" type="password" required style={{ width: '100%', padding: 8 }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Entrar</button>
      </form>

      <p style={{ marginTop: '1rem' }}>
        ¿No tienes cuenta? <a href="/registro">Regístrate</a>
      </p>
    </div>
  );
}