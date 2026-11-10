import { obtenerInicialesCuenta } from '../utils/cuentaActual';

interface AvatarProps {
  fotoUrl?: string | null;
  nombre?: string | null;
  email?: string | null;
  /** Lado en píxeles (el avatar es cuadrado y redondo). */
  tamano?: number;
  /** Iniciales a mostrar cuando no hay nombre utilizable. */
  respaldo?: string;
  className?: string;
}

const Avatar = ({ fotoUrl, nombre, email, tamano = 40, respaldo = 'US', className = '' }: AvatarProps) => {
  const estiloTamano = { width: tamano, height: tamano };

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre || 'Foto de perfil'}
        style={{ ...estiloTamano, objectFit: 'cover' }}
        className={`rounded-full ${className}`.trim()}
      />
    );
  }

  const iniciales = obtenerInicialesCuenta({ name: nombre ?? undefined, email: email ?? undefined }, respaldo);
  return (
    <span
      style={{ ...estiloTamano, fontSize: Math.round(tamano * 0.4) }}
      className={`inline-flex items-center justify-center rounded-full bg-red-600/10 font-black text-red-500 ${className}`.trim()}
    >
      {iniciales}
    </span>
  );
};

export default Avatar;
