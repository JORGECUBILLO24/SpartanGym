import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import Avatar from './Avatar';
import TarjetaMetrica from './TarjetaMetrica';

describe('Avatar', () => {
  it('con foto muestra la imagen con texto alternativo', () => {
    render(<Avatar fotoUrl="data:image/png;base64,AAAA" nombre="Ana Pérez" />);

    expect(screen.getByRole('img', { name: 'Ana Pérez' })).toHaveAttribute('src', 'data:image/png;base64,AAAA');
  });

  it('con foto pero sin nombre usa un texto alternativo genérico', () => {
    render(<Avatar fotoUrl="x.png" />);

    expect(screen.getByRole('img', { name: 'Foto de perfil' })).toBeInTheDocument();
  });

  it('sin foto muestra las iniciales del nombre', () => {
    render(<Avatar nombre="ana maría" />);

    expect(screen.getByText('AM')).toBeInTheDocument();
  });

  it('sin foto y solo con correo muestra el respaldo', () => {
    render(<Avatar email="ana@ejemplo.com" respaldo="AN" />);

    expect(screen.getByText('AN')).toBeInTheDocument();
  });

  it('aplica el tamaño pedido', () => {
    render(<Avatar nombre="Ana" tamano={64} />);

    expect(screen.getByText('A')).toHaveStyle({ width: '64px', height: '64px' });
  });
});

describe('TarjetaMetrica', () => {
  it('muestra título, valor y detalle', () => {
    render(<TarjetaMetrica titulo="Socios activos" valor="128" detalle="+4 esta semana" icono={Users} />);

    expect(screen.getByRole('heading', { level: 3, name: 'Socios activos' })).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('+4 esta semana')).toBeInTheDocument();
  });

  it('sin detalle no renderiza el párrafo de detalle', () => {
    render(<TarjetaMetrica titulo="Ingresos" valor="$10" icono={Users} />);

    expect(screen.queryByText(/esta semana/)).not.toBeInTheDocument();
  });
});
