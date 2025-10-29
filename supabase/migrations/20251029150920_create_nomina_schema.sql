/*
  # Crear esquema de Sistema de Nómina

  ## Resumen
  Crea las tablas necesarias para el sistema de nómina con persistencia completa de datos.

  ## 1. Nuevas Tablas
    
  ### `datos_config`
  Almacena la configuración del período de nómina
    - `id` (uuid, primary key)
    - `empresa` (text) - Nombre de la empresa
    - `mes` (text) - Mes del período
    - `fecha_corte` (date) - Fecha de corte del período
    - `dias_mes` (integer, default 30) - Días del mes
    - `created_at` (timestamptz) - Fecha de creación
    - `updated_at` (timestamptz) - Fecha de última actualización

  ### `empleados`
  Almacena la información de los empleados
    - `id` (uuid, primary key)
    - `apellidos` (text) - Apellidos del empleado
    - `nombres` (text) - Nombres del empleado
    - `cedula` (text) - Número de cédula
    - `cargo` (text) - Cargo del empleado
    - `asignacion` (text) - Tipo de asignación (Costo/Gasto)
    - `fecha_ingreso` (date) - Fecha de ingreso
    - `fecha_salida` (date, nullable) - Fecha de salida
    - `sueldo_nominal` (decimal) - Sueldo nominal
    - `activo` (boolean, default true) - Estado del empleado
    - `tiene_fondo_reserva` (boolean, default false) - Aplica para fondo de reserva
    - `acumula_fondo_reserva` (boolean, default false) - Acumula fondo de reserva
    - `mensualiza_decimos` (boolean, default false) - Mensualiza décimos
    - `created_at` (timestamptz) - Fecha de creación
    - `updated_at` (timestamptz) - Fecha de última actualización

  ### `rol_pagos`
  Almacena los datos del rol de pagos por empleado
    - `id` (uuid, primary key)
    - `empleado_id` (uuid, foreign key) - Referencia al empleado
    - `config_id` (uuid, foreign key) - Referencia a la configuración
    - `dias_mes` (integer) - Días del mes
    - `dias_trabajados` (integer) - Días trabajados
    - `sueldo_nominal` (decimal) - Sueldo nominal
    - Campos de ingresos editables
    - Campos de descuentos editables
    - `created_at` (timestamptz) - Fecha de creación
    - `updated_at` (timestamptz) - Fecha de última actualización

  ## 2. Seguridad
    - Se habilita RLS en todas las tablas
    - Se crean políticas permisivas para permitir todas las operaciones
    - En producción se deberían implementar políticas más restrictivas basadas en autenticación
*/

-- Tabla de configuración de datos
CREATE TABLE IF NOT EXISTS datos_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa text NOT NULL DEFAULT '',
  mes text NOT NULL DEFAULT '',
  fecha_corte date NOT NULL DEFAULT CURRENT_DATE,
  dias_mes integer NOT NULL DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apellidos text NOT NULL DEFAULT '',
  nombres text NOT NULL DEFAULT '',
  cedula text NOT NULL DEFAULT '',
  cargo text NOT NULL DEFAULT '',
  asignacion text NOT NULL DEFAULT '',
  fecha_ingreso date NOT NULL DEFAULT CURRENT_DATE,
  fecha_salida date,
  sueldo_nominal decimal(10, 2) NOT NULL DEFAULT 470.00,
  activo boolean NOT NULL DEFAULT true,
  tiene_fondo_reserva boolean NOT NULL DEFAULT false,
  acumula_fondo_reserva boolean NOT NULL DEFAULT false,
  mensualiza_decimos boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de rol de pagos
CREATE TABLE IF NOT EXISTS rol_pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id uuid NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  config_id uuid NOT NULL REFERENCES datos_config(id) ON DELETE CASCADE,
  dias_mes integer NOT NULL DEFAULT 30,
  dias_trabajados integer NOT NULL DEFAULT 30,
  sueldo_nominal decimal(10, 2) NOT NULL DEFAULT 0,
  horas_50 decimal(10, 2) NOT NULL DEFAULT 0,
  horas_100 decimal(10, 2) NOT NULL DEFAULT 0,
  bonificacion decimal(10, 2) NOT NULL DEFAULT 0,
  viaticos decimal(10, 2) NOT NULL DEFAULT 0,
  prestamos_empleado decimal(10, 2) NOT NULL DEFAULT 0,
  anticipo_sueldo decimal(10, 2) NOT NULL DEFAULT 0,
  retencion_renta decimal(10, 2) NOT NULL DEFAULT 0,
  otros_descuentos decimal(10, 2) NOT NULL DEFAULT 0,
  prestamos_iess decimal(10, 2) NOT NULL DEFAULT 0,
  deposito_iess decimal(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(empleado_id, config_id)
);

-- Habilitar RLS
ALTER TABLE datos_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE rol_pagos ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (permitir todas las operaciones)
-- En producción deberían ser más restrictivas
CREATE POLICY "Permitir lectura de configuración"
  ON datos_config FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción de configuración"
  ON datos_config FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización de configuración"
  ON datos_config FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir eliminación de configuración"
  ON datos_config FOR DELETE
  USING (true);

CREATE POLICY "Permitir lectura de empleados"
  ON empleados FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción de empleados"
  ON empleados FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización de empleados"
  ON empleados FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir eliminación de empleados"
  ON empleados FOR DELETE
  USING (true);

CREATE POLICY "Permitir lectura de rol de pagos"
  ON rol_pagos FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción de rol de pagos"
  ON rol_pagos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización de rol de pagos"
  ON rol_pagos FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir eliminación de rol de pagos"
  ON rol_pagos FOR DELETE
  USING (true);

-- Funciones para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar automáticamente updated_at
CREATE TRIGGER update_datos_config_updated_at 
  BEFORE UPDATE ON datos_config 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empleados_updated_at 
  BEFORE UPDATE ON empleados 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rol_pagos_updated_at 
  BEFORE UPDATE ON rol_pagos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_empleados_cedula ON empleados(cedula);
CREATE INDEX IF NOT EXISTS idx_empleados_activo ON empleados(activo);
CREATE INDEX IF NOT EXISTS idx_rol_pagos_empleado_id ON rol_pagos(empleado_id);
CREATE INDEX IF NOT EXISTS idx_rol_pagos_config_id ON rol_pagos(config_id);