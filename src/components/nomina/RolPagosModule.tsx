import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Empleado, RolPagosRow, DatosConfig } from "@/types/nomina";
import { nominaService } from "@/services/nominaService";

interface RolPagosModuleProps {
  empleados: Empleado[];
  datos: DatosConfig;
}

const calcularRolPagos = (empleado: Empleado, row: RolPagosRow, diasMes: number): RolPagosRow => {
  const sueldo = (row.sueldoNominal / diasMes) * row.diasTrabajados;
  const valorHoras50 = (row.sueldoNominal / 240) * row.horas50 * 1.5;
  const valorHoras100 = (row.sueldoNominal / 240) * 2 * row.horas100;

  const decimoTercero = (sueldo + valorHoras50 + valorHoras100) / 12;
  const decimoCuarto = ((470 / 240) * 8 * row.diasTrabajados) / 12;

  const totalGanado = sueldo + valorHoras50 + valorHoras100 + row.bonificacion + row.viaticos + decimoTercero + decimoCuarto;

  const aportePersonal = (sueldo + valorHoras50 + valorHoras100 + row.bonificacion) * 0.0945;

  const totalDescuentos = row.prestamosEmpleado + row.anticipoSueldo + row.retencionRenta +
    aportePersonal + row.otrosDescuentos + row.prestamosIess;

  const subtotal = totalGanado - totalDescuentos;

  const valorFondoReserva = empleado.acumulaFondoReserva
    ? (sueldo + valorHoras50 + valorHoras100) / 12
    : 0;

  const netoRecibir = subtotal + valorFondoReserva - row.depositoIess;

  return {
    ...row,
    sueldo,
    valorHoras50,
    valorHoras100,
    decimoTercero,
    decimoCuarto,
    totalGanado,
    aportePersonal,
    totalDescuentos,
    subtotal,
    valorFondoReserva,
    netoRecibir,
  };
};

export default function RolPagosModule({ empleados, datos }: RolPagosModuleProps) {
  const empleadosActivos = empleados.filter((e) => e.activo);

  const [rolPagos, setRolPagos] = useState<Record<string, RolPagosRow>>({});
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const loadRolPagos = async () => {
      setIsLoading(true);
      const savedRol = await nominaService.getRolPagos(datos.id);

      const initialRol: Record<string, RolPagosRow> = {};
      empleadosActivos.forEach((emp) => {
        if (savedRol[emp.id]) {
          initialRol[emp.id] = calcularRolPagos(emp, savedRol[emp.id], datos.diasMes);
        } else {
          const baseRow: RolPagosRow = {
            empleadoId: emp.id,
            diasMes: datos.diasMes,
            diasTrabajados: datos.diasMes,
            sueldoNominal: emp.sueldoNominal,
            horas50: 0,
            horas100: 0,
            bonificacion: 0,
            viaticos: 0,
            sueldo: 0,
            valorHoras50: 0,
            valorHoras100: 0,
            decimoTercero: 0,
            decimoCuarto: 0,
            totalGanado: 0,
            prestamosEmpleado: 0,
            anticipoSueldo: 0,
            retencionRenta: 0,
            otrosDescuentos: 0,
            prestamosIess: 0,
            aportePersonal: 0,
            totalDescuentos: 0,
            subtotal: 0,
            valorFondoReserva: 0,
            depositoIess: 0,
            netoRecibir: 0,
          };
          initialRol[emp.id] = calcularRolPagos(emp, baseRow, datos.diasMes);
        }
      });
      setRolPagos(initialRol);
      setIsLoading(false);
    };

    loadRolPagos();
  }, [empleadosActivos.length, datos.id, datos.diasMes]);

  const handleUpdate = (empleadoId: string, field: keyof RolPagosRow, value: number) => {
    const empleado = empleados.find((e) => e.id === empleadoId);
    if (!empleado) return;

    const updated = { ...rolPagos[empleadoId], [field]: value };
    const recalculated = calcularRolPagos(empleado, updated, datos.diasMes);

    setRolPagos({ ...rolPagos, [empleadoId]: recalculated });

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      nominaService.saveRolPago(datos.id, recalculated);
    }, 500);
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Cargando rol de pagos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Rol de Pagos</h2>
        <p className="text-sm text-muted-foreground">
          {datos.empresa} - {datos.mes}
        </p>
      </div>

      <Card className="border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead>
              <tr className="border-b bg-muted">
                <th colSpan={5} className="text-center p-3 font-bold border-r">DATOS</th>
                <th colSpan={13} className="text-center p-3 font-bold border-r">INGRESOS</th>
                <th colSpan={8} className="text-center p-3 font-bold border-r">DESCUENTOS</th>
                <th colSpan={3} className="text-center p-3 font-bold">LIQUIDACIÓN</th>
              </tr>
              <tr className="border-b bg-muted text-xs">
                {/* DATOS */}
                <th className="p-3 text-left whitespace-nowrap">No.</th>
                <th className="p-3 text-left whitespace-nowrap min-w-[200px]">Nombre Completo</th>
                <th className="p-3 text-left whitespace-nowrap min-w-[150px]">Cargo</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[100px]">Días Trabajados</th>
                <th className="p-3 text-right border-r whitespace-nowrap min-w-[120px]">Sueldo Nominal</th>

                {/* INGRESOS */}
                <th className="p-3 text-right whitespace-nowrap min-w-[120px]">Sueldo</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[100px]">Horas Trabajadas al 50%</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[120px]">Valor Horas 50%</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[100px]">Horas Trabajadas al 100%</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[120px]">Valor Horas 100%</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[120px]">Bonificación</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[120px]">Viáticos</th>
                <th className="p-3 text-center whitespace-nowrap min-w-[100px]">Acumula Fondos</th>
                <th className="p-3 text-center whitespace-nowrap min-w-[120px]">Mensualiza Décimos</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[130px]">Fondo de Reserva</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[100px]">Decimo Tercero Mensualizado</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[120px]">Décimo Cuarto Mensualizado</th>
                <th className="p-3 text-right border-r whitespace-nowrap min-w-[130px]">Total Ganado</th>

                {/* DESCUENTOS */}
                <th className="p-3 text-right whitespace-nowrap min-w-[130px]">Préstamos a Empleado</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[120px]">Anticipo Sueldo</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[120px]">Ret. Relacion Dependencia</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[120px]">Aporte IESS</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[100px]">Otros Descuentos</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[130px]">Préstamos IESS</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[130px]">Total Descuentos</th>
                <th className="p-3 text-right border-r whitespace-nowrap min-w-[120px]">Subtotal</th>

                {/* LIQUIDACIÓN */}
                <th className="p-3 text-right whitespace-nowrap min-w-[130px]">Depósito IESS</th>
                <th className="p-3 text-center whitespace-nowrap min-w-[100px]">Estado Empleado</th>
                <th className="p-3 text-right whitespace-nowrap min-w-[140px]">Neto a Recibir</th>
              </tr>
            </thead>
            <tbody>
              {empleadosActivos.map((empleado, index) => {
                const row = rolPagos[empleado.id];
                if (!row) return null;

                return (
                  <tr key={empleado.id} className="border-b hover:bg-muted/50">
                    {/* DATOS */}
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 font-medium">{`${empleado.apellidos} ${empleado.nombres}`}</td>
                    <td className="p-3 text-muted-foreground">{empleado.cargo}</td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={row.diasTrabajados === 0 ? "" : row.diasTrabajados}
                        onChange={(e) => handleUpdate(empleado.id, "diasTrabajados", parseFloat(e.target.value) || 0)}
                        className="h-9 text-right text-sm min-w-[100px]"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-3 text-right border-r bg-muted/30 font-mono">${formatCurrency(row.sueldoNominal)}</td>

                    {/* INGRESOS */}
                    <td className="p-3 text-right bg-muted/30 font-mono">${formatCurrency(row.sueldo)}</td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={row.horas50 === 0 ? "" : row.horas50}
                        onChange={(e) => handleUpdate(empleado.id, "horas50", parseFloat(e.target.value) || 0)}
                        className="h-9 text-right text-sm min-w-[100px]"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-3 text-right bg-muted/30 font-mono">${formatCurrency(row.valorHoras50)}</td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={row.horas100 === 0 ? "" : row.horas100}
                        onChange={(e) => handleUpdate(empleado.id, "horas100", parseFloat(e.target.value) || 0)}
                        className="h-9 text-right text-sm min-w-[100px]"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-3 text-right bg-muted/30 font-mono">${formatCurrency(row.valorHoras100)}</td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={row.bonificacion === 0 ? "" : row.bonificacion}
                        onChange={(e) => handleUpdate(empleado.id, "bonificacion", parseFloat(e.target.value) || 0)}
                        className="h-9 text-right text-sm min-w-[120px]"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={row.viaticos === 0 ? "" : row.viaticos}
                        onChange={(e) => handleUpdate(empleado.id, "viaticos", parseFloat(e.target.value) || 0)}
                        className="h-9 text-right text-sm min-w-[120px]"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-xs">{empleado.acumulaFondoReserva ? 'Sí' : 'No'}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-xs">{empleado.mensualizaDecimos ? 'Sí' : 'No'}</span>
                    </td>
                    <td className="p-3 text-right bg-muted/30 font-mono">${formatCurrency(row.valorFondoReserva)}</td>
                    <td className="p-3 text-right bg-muted/30 font-mono">${formatCurrency(row.decimoTercero)}</td>
                    <td className="p-3 text-right bg-muted/30 font-mono">${formatCurrency(row.decimoCuarto)}</td>
                    <td className="p-3 text-right bg-muted/30 font-mono font-semibold border-r">${formatCurrency(row.totalGanado)}</td>

                    {/* DESCUENTOS */}
                    <td className="p-3">
                      <Input
                        type="number"
                        value={row.prestamosEmpleado === 0 ? "" : row.prestamosEmpleado}
                        onChange={(e) => handleUpdate(empleado.id, "prestamosEmpleado", parseFloat(e.target.value) || 0)}
                        className="h-9 text-right text-sm min-w-[130px]"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={row.anticipoSueldo === 0 ? "" : row.anticipoSueldo}
                        onChange={(e) => handleUpdate(empleado.id, "anticipoSueldo", parseFloat(e.target.value) || 0)}
                        className="h-9 text-right text-sm min-w-[120px]"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={row.retencionRenta === 0 ? "" : row.retencionRenta}
                        onChange={(e) => handleUpdate(empleado.id, "retencionRenta", parseFloat(e.target.value) || 0)}
                        className="h-9 text-right text-sm min-w-[120px]"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-3 text-right bg-muted/30 font-mono">${formatCurrency(row.aportePersonal)}</td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={row.otrosDescuentos === 0 ? "" : row.otrosDescuentos}
                        onChange={(e) => handleUpdate(empleado.id, "otrosDescuentos", parseFloat(e.target.value) || 0)}
                        className="h-9 text-right text-sm min-w-[100px]"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={row.prestamosIess === 0 ? "" : row.prestamosIess}
                        onChange={(e) => handleUpdate(empleado.id, "prestamosIess", parseFloat(e.target.value) || 0)}
                        className="h-9 text-right text-sm min-w-[130px]"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-3 text-right bg-muted/30 font-mono font-semibold">${formatCurrency(row.totalDescuentos)}</td>
                    <td className="p-3 text-right bg-muted/30 font-mono border-r">${formatCurrency(row.subtotal)}</td>

                    {/* LIQUIDACIÓN */}
                    <td className="p-3">
                      <Input
                        type="number"
                        value={row.depositoIess === 0 ? "" : row.depositoIess}
                        onChange={(e) => handleUpdate(empleado.id, "depositoIess", parseFloat(e.target.value) || 0)}
                        className="h-9 text-right text-sm min-w-[130px]"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${empleado.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {empleado.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-3 text-right bg-muted font-mono font-bold text-base">${formatCurrency(row.netoRecibir)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
