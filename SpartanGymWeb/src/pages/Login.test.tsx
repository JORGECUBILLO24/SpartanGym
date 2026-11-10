import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';
import { CLAVE_CUENTA_ACTUAL } from '../utils/cuentaActual';

// useLogosApp y useConfiguracionApp piden la configuración remota por red; en estas pruebas
// no interesa, y así el único fetch es el del login.
vi.mock('../utils/logosApp', () => ({
  useLogosApp: () => ({ principal: '', acceso: '', fondoLogin: '' }),
}));
vi.mock('../utils/configuracionApp', () => ({
  useConfiguracionApp: () => ({}),
  obtenerNombreGimnasio: () => 'Spartan Gym',
}));

const fetchMock = vi.fn();

const json = (cuerpo: unknown, status = 200, tipo = 'application/json'): Response =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': tipo } });

const problema = (detail: string, status: number, codigo: string): Response =>
  json({ type: 'about:blank', status, detail, codigo }, status, 'application/problem+json');

const renderizar = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<p>Panel de administración</p>} />
        <Route path="/recepcion" element={<p>Panel de recepción</p>} />
      </Routes>
    </MemoryRouter>,
  );

async function completarYEnviar(rol = '') {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText('Correo electrónico'), 'admin@spartangym.com');
  await usuario.type(screen.getByLabelText('Contraseña'), 'clave-de-prueba');
  if (rol) await usuario.selectOptions(screen.getByLabelText(/^Rol/), rol);
  await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Login: mensajes de error', () => {
  it('credenciales inválidas: muestra el detalle REAL que manda la API', async () => {
    fetchMock.mockResolvedValue(problema('Correo o contraseña incorrectos.', 400, 'CREDENCIALES_INVALIDAS'));

    renderizar();
    await completarYEnviar();

    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeInTheDocument();
    expect(screen.queryByText(/No se pudo conectar/)).not.toBeInTheDocument();
  });

  it('fallo de conexión o CORS: NO culpa a las credenciales', async () => {
    // Regresión real: un origen bloqueado por CORS mostraba "verifica tus credenciales".
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    renderizar();
    await completarYEnviar();

    expect(await screen.findByText('No se pudo conectar con la API. Verifica tu conexión a internet.')).toBeInTheDocument();
    // El subtítulo "Ingresa tus credenciales..." es parte del diseño; lo que no debe aparecer es
    // el mensaje viejo que culpaba a las credenciales de un fallo de red.
    expect(screen.queryByText(/verifica tus credenciales/i)).not.toBeInTheDocument();
  });

  it('un 503 con problem+json muestra el mensaje de indisponibilidad de la API', async () => {
    fetchMock.mockResolvedValue(problema('El servicio no esta disponible temporalmente.', 503, 'SERVICIO_NO_DISPONIBLE'));

    renderizar();
    await completarYEnviar();

    expect(await screen.findByText('El servicio no esta disponible temporalmente.')).toBeInTheDocument();
  });

  it('el rol elegido no coincide con el de la cuenta: avisa y no deja la sesión guardada', async () => {
    fetchMock.mockResolvedValue(json({ id: '1', token: 't', email: 'admin@spartangym.com', rol: 'ROLE_ADMIN' }));

    renderizar();
    await completarYEnviar('ROLE_SUPERADMIN');

    expect(await screen.findByText('El rol seleccionado no coincide con el usuario autenticado.')).toBeInTheDocument();
    expect(localStorage.getItem('spartan_token')).toBeNull();
  });

  it('un rol sin acceso al panel web (socio) se rechaza', async () => {
    fetchMock.mockResolvedValue(json({ id: '1', token: 't', email: 'socio@spartangym.com', rol: 'ROLE_SOCIO' }));

    renderizar();
    await completarYEnviar();

    expect(await screen.findByText('Tu rol no tiene acceso al panel web administrativo.')).toBeInTheDocument();
    expect(localStorage.getItem('spartan_token')).toBeNull();
  });
});

describe('Login: inicio de sesión correcto', () => {
  it('un administrador entra a /admin y queda la sesión guardada en los dos lugares', async () => {
    fetchMock.mockResolvedValue(json({ id: '1', token: 'tok', email: 'admin@spartangym.com', rol: 'ROLE_ADMIN' }));

    renderizar();
    await completarYEnviar('ROLE_ADMIN');

    expect(await screen.findByText('Panel de administración')).toBeInTheDocument();
    expect(localStorage.getItem('spartan_token')).toBe('tok');
    expect(JSON.parse(localStorage.getItem(CLAVE_CUENTA_ACTUAL) ?? '{}')).toMatchObject({
      username: 'admin@spartangym.com',
      role: 'Administrador',
    });
  });

  it('un recepcionista entra a /recepcion', async () => {
    fetchMock.mockResolvedValue(json({ id: '2', token: 'tok', email: 'recepcion@spartangym.com', rol: 'ROLE_RECEPCIONISTA' }));

    renderizar();
    await completarYEnviar();

    expect(await screen.findByText('Panel de recepción')).toBeInTheDocument();
  });

  it('mientras espera a la API el botón avisa y se desactiva', async () => {
    let resolver: (r: Response) => void = () => undefined;
    fetchMock.mockReturnValue(new Promise<Response>((r) => { resolver = r; }));

    renderizar();
    await completarYEnviar();

    expect(await screen.findByRole('button', { name: 'Iniciando sesión…' })).toBeDisabled();

    resolver(problema('Correo o contraseña incorrectos.', 400, 'CREDENCIALES_INVALIDAS'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled());
  });
});
