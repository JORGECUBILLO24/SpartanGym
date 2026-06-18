-- ==========================================
-- Spartan Gym PostgreSQL schema
-- Alineado con las entidades JPA de SpartanGymAPI
-- ==========================================

-- Ejecuta CREATE DATABASE desde una conexión administrativa si la BD no existe:
-- CREATE DATABASE spartangym_db;
-- Luego conéctate a spartangym_db antes de ejecutar el resto del script.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Catálogos
-- ==========================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS tipos_membresia (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    duracion_dias INT NOT NULL CHECK (duracion_dias > 0),
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0)
);

CREATE TABLE IF NOT EXISTS grupos_musculares (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (nombre) VALUES
    ('ROLE_SUPERADMIN'),
    ('ROLE_ADMIN'),
    ('ROLE_RECEPCIONISTA'),
    ('ROLE_ENTRENADOR'),
    ('ROLE_SOCIO')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipos_membresia (nombre, duracion_dias, precio) VALUES
    ('Mensual', 30, 30.00),
    ('Quincenal', 15, 18.00),
    ('Trimestral', 90, 80.00),
    ('Semestral', 180, 150.00),
    ('Anual', 365, 250.00)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO grupos_musculares (nombre) VALUES
    ('Pecho'),
    ('Espalda'),
    ('Tríceps'),
    ('Piernas'),
    ('Hombros'),
    ('Bíceps')
ON CONFLICT (nombre) DO NOTHING;

-- ==========================================
-- 2. Usuarios, socios y personal
-- ==========================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL REFERENCES roles(id),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS socios (
    usuario_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    estado_acceso VARCHAR(20) DEFAULT 'Inactivo' CHECK (estado_acceso IN ('Activo', 'Inactivo', 'Suspendido'))
);

CREATE TABLE IF NOT EXISTS personal (
    usuario_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    especialidad VARCHAR(100)
);


-- Usuario inicial para administración del sistema.
-- Email: admin@spartangym
-- Contraseña: admin123
WITH rol_superadmin AS (
    SELECT id FROM roles WHERE nombre = 'ROLE_SUPERADMIN'
), usuario_superadmin AS (
    INSERT INTO usuarios (email, password_hash, rol_id, activo)
    SELECT 'admin@spartangym', '$2y$12$qMiACDBSKqYNbjb7JHPYKeoKFj0G3mDbiQUrZscdptgrkglHeJ9hW', id, TRUE
    FROM rol_superadmin
    ON CONFLICT (email) DO UPDATE
        SET rol_id = EXCLUDED.rol_id,
            activo = TRUE
    RETURNING id
)
INSERT INTO personal (usuario_id, nombres, apellidos, especialidad)
SELECT id, 'Super', 'Admin', 'Control Maestro'
FROM usuario_superadmin
ON CONFLICT (usuario_id) DO UPDATE
    SET nombres = EXCLUDED.nombres,
        apellidos = EXCLUDED.apellidos,
        especialidad = EXCLUDED.especialidad;

-- ==========================================
-- 3. Rutinas y progreso
-- ==========================================
CREATE TABLE IF NOT EXISTS ejercicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    grupo_muscular_id INT NOT NULL REFERENCES grupos_musculares(id)
);

CREATE TABLE IF NOT EXISTS controles_biometricos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    socio_id UUID NOT NULL REFERENCES socios(usuario_id) ON DELETE CASCADE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    peso_kg DECIMAL(5, 2) NOT NULL CHECK (peso_kg > 0),
    medidas_notas TEXT
);

CREATE TABLE IF NOT EXISTS rutinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    socio_id UUID NOT NULL REFERENCES socios(usuario_id) ON DELETE CASCADE,
    entrenador_id UUID NOT NULL REFERENCES personal(usuario_id),
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    objetivo VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS detalle_rutinas (
    rutina_id UUID NOT NULL REFERENCES rutinas(id) ON DELETE CASCADE,
    ejercicio_id INT NOT NULL REFERENCES ejercicios(id),
    series INT NOT NULL CHECK (series > 0),
    repeticiones INT NOT NULL CHECK (repeticiones > 0),
    peso_sugerido_kg DECIMAL(6, 2),
    tiempo_descanso_segundos INT,
    PRIMARY KEY (rutina_id, ejercicio_id)
);

-- ==========================================
-- 4. Pagos, membresías y asistencia
-- ==========================================
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    socio_id UUID NOT NULL REFERENCES socios(usuario_id),
    monto DECIMAL(10, 2) NOT NULL CHECK (monto >= 0),
    metodo_pago VARCHAR(50) NOT NULL,
    fecha_transaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membresias_socio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    socio_id UUID NOT NULL REFERENCES socios(usuario_id) ON DELETE CASCADE,
    tipo_membresia_id INT NOT NULL REFERENCES tipos_membresia(id),
    pago_id UUID NOT NULL REFERENCES pagos(id),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'Activa' CHECK (estado IN ('Activa', 'Vencida', 'Cancelada'))
);

CREATE TABLE IF NOT EXISTS asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    socio_id UUID NOT NULL REFERENCES socios(usuario_id) ON DELETE CASCADE,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_membresia_activa_unica
ON membresias_socio (socio_id)
WHERE estado = 'Activa';

CREATE INDEX IF NOT EXISTS idx_asistencias_socio_fecha
ON asistencias (socio_id, fecha_hora DESC);

CREATE INDEX IF NOT EXISTS idx_pagos_socio_fecha
ON pagos (socio_id, fecha_transaccion DESC);

-- ==========================================
-- 5. Finanzas e inventario administrativos
-- ==========================================
CREATE TABLE IF NOT EXISTS productos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL CHECK (stock >= 0),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimientos_financieros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concepto VARCHAR(150) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL CHECK (monto >= 0),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
    metodo VARCHAR(50) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    usuario VARCHAR(120) NOT NULL,
    fecha_transaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_fecha
ON movimientos_financieros (fecha_transaccion DESC);

CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL,
    titulo VARCHAR(120) NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_fecha
ON notificaciones (usuario_id, fecha_creacion DESC);
