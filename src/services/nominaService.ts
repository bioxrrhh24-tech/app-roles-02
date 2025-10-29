import { supabase } from '@/lib/supabase';
import { DatosConfig, Empleado, RolPagosRow } from '@/types/nomina';

export const nominaService = {
  async getDatosConfig(): Promise<DatosConfig | null> {
    const { data, error } = await supabase
      .from('datos_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener configuración:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      empresa: data.empresa,
      mes: data.mes,
      fechaCorte: data.fecha_corte,
      diasMes: data.dias_mes,
    };
  },

  async saveDatosConfig(datos: DatosConfig): Promise<DatosConfig | null> {
    const dbData = {
      id: datos.id === '1' ? undefined : datos.id,
      empresa: datos.empresa,
      mes: datos.mes,
      fecha_corte: datos.fechaCorte,
      dias_mes: datos.diasMes,
    };

    const { data, error } = await supabase
      .from('datos_config')
      .upsert(dbData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error al guardar configuración:', error);
      return null;
    }

    return {
      id: data.id,
      empresa: data.empresa,
      mes: data.mes,
      fechaCorte: data.fecha_corte,
      diasMes: data.dias_mes,
    };
  },

  async getEmpleados(): Promise<Empleado[]> {
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error al obtener empleados:', error);
      return [];
    }

    if (!data) return [];

    return data.map((emp) => ({
      id: emp.id,
      apellidos: emp.apellidos,
      nombres: emp.nombres,
      cedula: emp.cedula,
      cargo: emp.cargo,
      asignacion: emp.asignacion,
      fechaIngreso: emp.fecha_ingreso,
      fechaSalida: emp.fecha_salida || undefined,
      sueldoNominal: parseFloat(emp.sueldo_nominal),
      activo: emp.activo,
      tieneFondoReserva: emp.tiene_fondo_reserva,
      acumulaFondoReserva: emp.acumula_fondo_reserva,
      mensualizaDecimos: emp.mensualiza_decimos,
    }));
  },

  async saveEmpleado(empleado: Empleado): Promise<Empleado | null> {
    const dbData = {
      id: empleado.id.startsWith('emp-') ? undefined : empleado.id,
      apellidos: empleado.apellidos,
      nombres: empleado.nombres,
      cedula: empleado.cedula,
      cargo: empleado.cargo,
      asignacion: empleado.asignacion,
      fecha_ingreso: empleado.fechaIngreso,
      fecha_salida: empleado.fechaSalida || null,
      sueldo_nominal: empleado.sueldoNominal,
      activo: empleado.activo,
      tiene_fondo_reserva: empleado.tieneFondoReserva,
      acumula_fondo_reserva: empleado.acumulaFondoReserva,
      mensualiza_decimos: empleado.mensualizaDecimos,
    };

    const { data, error } = await supabase
      .from('empleados')
      .upsert(dbData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error al guardar empleado:', error);
      return null;
    }

    return {
      id: data.id,
      apellidos: data.apellidos,
      nombres: data.nombres,
      cedula: data.cedula,
      cargo: data.cargo,
      asignacion: data.asignacion,
      fechaIngreso: data.fecha_ingreso,
      fechaSalida: data.fecha_salida || undefined,
      sueldoNominal: parseFloat(data.sueldo_nominal),
      activo: data.activo,
      tieneFondoReserva: data.tiene_fondo_reserva,
      acumulaFondoReserva: data.acumula_fondo_reserva,
      mensualizaDecimos: data.mensualiza_decimos,
    };
  },

  async deleteEmpleado(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('empleados')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar empleado:', error);
      return false;
    }

    return true;
  },

  async getRolPagos(configId: string): Promise<Record<string, RolPagosRow>> {
    const { data, error } = await supabase
      .from('rol_pagos')
      .select('*')
      .eq('config_id', configId);

    if (error) {
      console.error('Error al obtener rol de pagos:', error);
      return {};
    }

    if (!data) return {};

    const result: Record<string, RolPagosRow> = {};
    data.forEach((row) => {
      result[row.empleado_id] = {
        empleadoId: row.empleado_id,
        diasMes: row.dias_mes,
        diasTrabajados: row.dias_trabajados,
        sueldoNominal: parseFloat(row.sueldo_nominal),
        horas50: parseFloat(row.horas_50),
        horas100: parseFloat(row.horas_100),
        bonificacion: parseFloat(row.bonificacion),
        viaticos: parseFloat(row.viaticos),
        sueldo: 0,
        valorHoras50: 0,
        valorHoras100: 0,
        decimoTercero: 0,
        decimoCuarto: 0,
        totalGanado: 0,
        prestamosEmpleado: parseFloat(row.prestamos_empleado),
        anticipoSueldo: parseFloat(row.anticipo_sueldo),
        retencionRenta: parseFloat(row.retencion_renta),
        otrosDescuentos: parseFloat(row.otros_descuentos),
        prestamosIess: parseFloat(row.prestamos_iess),
        aportePersonal: 0,
        totalDescuentos: 0,
        subtotal: 0,
        valorFondoReserva: 0,
        depositoIess: parseFloat(row.deposito_iess),
        netoRecibir: 0,
      };
    });

    return result;
  },

  async saveRolPago(configId: string, row: RolPagosRow): Promise<boolean> {
    const dbData = {
      empleado_id: row.empleadoId,
      config_id: configId,
      dias_mes: row.diasMes,
      dias_trabajados: row.diasTrabajados,
      sueldo_nominal: row.sueldoNominal,
      horas_50: row.horas50,
      horas_100: row.horas100,
      bonificacion: row.bonificacion,
      viaticos: row.viaticos,
      prestamos_empleado: row.prestamosEmpleado,
      anticipo_sueldo: row.anticipoSueldo,
      retencion_renta: row.retencionRenta,
      otros_descuentos: row.otrosDescuentos,
      prestamos_iess: row.prestamosIess,
      deposito_iess: row.depositoIess,
    };

    const { error } = await supabase
      .from('rol_pagos')
      .upsert(dbData, { onConflict: 'empleado_id,config_id' });

    if (error) {
      console.error('Error al guardar rol de pago:', error);
      return false;
    }

    return true;
  },
};
