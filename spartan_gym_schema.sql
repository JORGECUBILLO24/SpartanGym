
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
    ('Bíceps'),
    ('Glúteos'),
    ('Abdomen'),
    ('Cardio')
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
    telefono VARCHAR(20),
    especialidad VARCHAR(100)
);


CREATE TABLE IF NOT EXISTS sucursales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(120) NOT NULL,
    ubicacion VARCHAR(255) NOT NULL,
    telefono VARCHAR(25),
    capacidad INT NOT NULL CHECK (capacidad >= 0),
    horario_apertura VARCHAR(20) NOT NULL,
    horario_cierre VARCHAR(20) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'Operativa',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE socios
    ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES sucursales(id);

ALTER TABLE personal
    ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

ALTER TABLE personal
    ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES sucursales(id);

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

INSERT INTO ejercicios (nombre, grupo_muscular_id)
SELECT 'Press banca', id FROM grupos_musculares WHERE nombre = 'Pecho'
AND NOT EXISTS (SELECT 1 FROM ejercicios WHERE nombre = 'Press banca');

INSERT INTO ejercicios (nombre, grupo_muscular_id)
SELECT 'Remo con barra', id FROM grupos_musculares WHERE nombre = 'Espalda'
AND NOT EXISTS (SELECT 1 FROM ejercicios WHERE nombre = 'Remo con barra');

INSERT INTO ejercicios (nombre, grupo_muscular_id)
SELECT 'Sentadilla libre', id FROM grupos_musculares WHERE nombre = 'Piernas'
AND NOT EXISTS (SELECT 1 FROM ejercicios WHERE nombre = 'Sentadilla libre');

INSERT INTO ejercicios (nombre, grupo_muscular_id)
SELECT 'Press militar', id FROM grupos_musculares WHERE nombre = 'Hombros'
AND NOT EXISTS (SELECT 1 FROM ejercicios WHERE nombre = 'Press militar');

INSERT INTO ejercicios (nombre, grupo_muscular_id)
SELECT 'Curl bíceps', id FROM grupos_musculares WHERE nombre = 'Bíceps'
AND NOT EXISTS (SELECT 1 FROM ejercicios WHERE nombre = 'Curl bíceps');

INSERT INTO ejercicios (nombre, grupo_muscular_id)
SELECT 'Extensión de tríceps', id FROM grupos_musculares WHERE nombre = 'Tríceps'
AND NOT EXISTS (SELECT 1 FROM ejercicios WHERE nombre = 'Extensión de tríceps');

INSERT INTO ejercicios (nombre, grupo_muscular_id)
SELECT 'Hip thrust', id FROM grupos_musculares WHERE nombre = 'Glúteos'
AND NOT EXISTS (SELECT 1 FROM ejercicios WHERE nombre = 'Hip thrust');

INSERT INTO ejercicios (nombre, grupo_muscular_id)
SELECT 'Peso muerto rumano', id FROM grupos_musculares WHERE nombre = 'Piernas'
AND NOT EXISTS (SELECT 1 FROM ejercicios WHERE nombre = 'Peso muerto rumano');

INSERT INTO ejercicios (nombre, grupo_muscular_id)
SELECT 'Plancha abdominal', id FROM grupos_musculares WHERE nombre = 'Abdomen'
AND NOT EXISTS (SELECT 1 FROM ejercicios WHERE nombre = 'Plancha abdominal');

INSERT INTO ejercicios (nombre, grupo_muscular_id)
SELECT 'Caminadora inclinada', id FROM grupos_musculares WHERE nombre = 'Cardio'
AND NOT EXISTS (SELECT 1 FROM ejercicios WHERE nombre = 'Caminadora inclinada');

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
    nombre VARCHAR(140),
    tipo_rutina VARCHAR(40) DEFAULT 'General',
    genero_objetivo VARCHAR(20) DEFAULT 'Todos',
    es_global BOOLEAN DEFAULT FALSE,
    fecha_inicio DATE,
    fecha_fin DATE,
    objetivo VARCHAR(180),
    notas TEXT
);

ALTER TABLE rutinas
    ADD COLUMN IF NOT EXISTS nombre VARCHAR(140),
    ADD COLUMN IF NOT EXISTS tipo_rutina VARCHAR(40) DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS genero_objetivo VARCHAR(20) DEFAULT 'Todos',
    ADD COLUMN IF NOT EXISTS es_global BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS fecha_inicio DATE,
    ADD COLUMN IF NOT EXISTS fecha_fin DATE,
    ADD COLUMN IF NOT EXISTS notas TEXT;

ALTER TABLE rutinas
    ALTER COLUMN objetivo TYPE VARCHAR(180);

CREATE TABLE IF NOT EXISTS detalle_rutinas (
    rutina_id UUID NOT NULL REFERENCES rutinas(id) ON DELETE CASCADE,
    ejercicio_id INT NOT NULL REFERENCES ejercicios(id),
    series INT NOT NULL CHECK (series > 0),
    repeticiones INT NOT NULL CHECK (repeticiones > 0),
    tipo_ejercicio VARCHAR(40),
    dia_programado DATE,
    peso_sugerido_kg DECIMAL(6, 2),
    tiempo_descanso_segundos INT,
    notas VARCHAR(255),
    orden INT,
    PRIMARY KEY (rutina_id, ejercicio_id)
);

ALTER TABLE detalle_rutinas
    ADD COLUMN IF NOT EXISTS tipo_ejercicio VARCHAR(40),
    ADD COLUMN IF NOT EXISTS dia_programado DATE,
    ADD COLUMN IF NOT EXISTS notas VARCHAR(255),
    ADD COLUMN IF NOT EXISTS orden INT;

-- ==========================================
-- 4. Pagos, membresías y asistencia
-- ==========================================
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    socio_id UUID NOT NULL REFERENCES socios(usuario_id),
    monto DECIMAL(10, 2) NOT NULL CHECK (monto >= 0),
    metodo_pago VARCHAR(50) NOT NULL,
    numero_factura VARCHAR(40),
    fecha_transaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Numero de factura para la renovacion de membresia (facturacion en Finanzas)
ALTER TABLE pagos
    ADD COLUMN IF NOT EXISTS numero_factura VARCHAR(40);

CREATE TABLE IF NOT EXISTS membresias_socio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    socio_id UUID NOT NULL REFERENCES socios(usuario_id) ON DELETE CASCADE,
    tipo_membresia_id INT NOT NULL REFERENCES tipos_membresia(id),
    pago_id UUID NOT NULL REFERENCES pagos(id),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'Activa' CHECK (estado IN ('Activa', 'Vencida', 'Cancelada', 'Renovada'))
);

CREATE TABLE IF NOT EXISTS asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    socio_id UUID NOT NULL REFERENCES socios(usuario_id) ON DELETE CASCADE,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    qr_token_hash VARCHAR(64)
);

ALTER TABLE asistencias
    ADD COLUMN IF NOT EXISTS qr_token_hash VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS idx_membresia_activa_unica
ON membresias_socio (socio_id)
WHERE estado = 'Activa';

CREATE INDEX IF NOT EXISTS idx_asistencias_socio_fecha
ON asistencias (socio_id, fecha_hora DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_asistencias_qr_token_hash
ON asistencias (qr_token_hash)
WHERE qr_token_hash IS NOT NULL;

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
    imagen_url TEXT,
    sucursal_id UUID REFERENCES sucursales(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE productos_inventario
    ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES sucursales(id);

ALTER TABLE productos_inventario
    ADD COLUMN IF NOT EXISTS imagen_url TEXT;

CREATE TABLE IF NOT EXISTS movimientos_financieros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concepto VARCHAR(150) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL CHECK (monto >= 0),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
    metodo VARCHAR(50) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    usuario VARCHAR(120) NOT NULL,
    sucursal_id UUID REFERENCES sucursales(id),
    fecha_transaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE movimientos_financieros
    ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES sucursales(id);

CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_fecha
ON movimientos_financieros (fecha_transaccion DESC);

CREATE TABLE IF NOT EXISTS ventas_productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_factura VARCHAR(40) UNIQUE NOT NULL,
    cliente_eventual BOOLEAN NOT NULL DEFAULT FALSE,
    socio_id UUID REFERENCES socios(usuario_id),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    vendedor_id UUID REFERENCES usuarios(id),
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_documento VARCHAR(80),
    metodo_pago VARCHAR(50) NOT NULL,
    moneda_pago VARCHAR(10),
    tipo_cambio DECIMAL(10, 4),
    monto_recibido DECIMAL(10, 2),
    monto_recibido_convertido DECIMAL(10, 2),
    cambio DECIMAL(10, 2),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    impuesto DECIMAL(10, 2) NOT NULL CHECK (impuesto >= 0),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    observaciones VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ventas_productos
    ADD COLUMN IF NOT EXISTS moneda_pago VARCHAR(10);

ALTER TABLE ventas_productos
    ADD COLUMN IF NOT EXISTS tipo_cambio DECIMAL(10, 4);

ALTER TABLE ventas_productos
    ADD COLUMN IF NOT EXISTS monto_recibido DECIMAL(10, 2);

ALTER TABLE ventas_productos
    ADD COLUMN IF NOT EXISTS monto_recibido_convertido DECIMAL(10, 2);

ALTER TABLE ventas_productos
    ADD COLUMN IF NOT EXISTS cambio DECIMAL(10, 2);

CREATE TABLE IF NOT EXISTS detalle_ventas_productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL REFERENCES ventas_productos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos_inventario(id),
    producto_nombre VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    total_linea DECIMAL(10, 2) NOT NULL CHECK (total_linea >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ventas_productos_fecha
ON ventas_productos (fecha_creacion DESC);

CREATE INDEX IF NOT EXISTS idx_ventas_productos_sucursal_fecha
ON ventas_productos (sucursal_id, fecha_creacion DESC);

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

-- ==========================================
-- 6. Recuperación segura de contraseñas
-- ==========================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    fecha_expiracion TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_usuario
ON password_reset_tokens (usuario_id, usado, fecha_expiracion DESC);

-- ==========================================
-- 7. Configuración compartida web / app móvil
-- ==========================================
CREATE TABLE IF NOT EXISTS configuracion_app (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    configuracion_json TEXT NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO configuracion_app (id, configuracion_json)
VALUES (
    1,
    '{"gymName":"Spartan Gym","email":"admin@spartangym.com","phone":"+505 0000 0000","currency":"USD","taxRate":"15","theme":"system","themeSource":"system","accentColor":"#e50914","accentHoverColor":"#b91c1c","accentSoftColor":"#450a0a","logoPrincipal":"","logoAcceso":"","fondoLogin":"","emailAlerts":true,"smsAlerts":false,"dailyReports":true,"twoFactor":false,"sessionTimeout":"30"}'
)
ON CONFLICT (id) DO NOTHING;