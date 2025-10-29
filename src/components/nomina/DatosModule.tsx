import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatosConfig } from "@/types/nomina";
import { ArrowRight } from "lucide-react";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

interface DatosModuleProps {
  datos: DatosConfig;
  onUpdate: (datos: DatosConfig) => void;
  onContinue?: () => void;
}

const isFormComplete = (datos: DatosConfig): boolean => {
  return datos.empresa.trim() !== "" && datos.mes !== "" && datos.fechaCorte !== "";
};

export default function DatosModule({ datos, onUpdate, onContinue }: DatosModuleProps) {
  const [localDatos, setLocalDatos] = useState(datos);

  const handleChange = (field: keyof DatosConfig, value: string) => {
    const updated = { ...localDatos, [field]: value };

    if (field === "mes") {
      updated.diasMes = 30;
    }

    setLocalDatos(updated);
    onUpdate(updated);
  };

  const handleContinue = () => {
    if (isFormComplete(localDatos) && onContinue) {
      onContinue();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold">Sistema de Nómina</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Configure los datos generales del período de nómina para comenzar
        </p>
      </div>

      <Card className="p-8 border">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="empresa" className="text-base font-semibold">
                Nombre de la Empresa
              </Label>
              <Input
                id="empresa"
                value={localDatos.empresa}
                onChange={(e) => handleChange("empresa", e.target.value)}
                placeholder="Ingrese el nombre de su empresa"
                className="h-12 text-base"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="mes" className="text-base font-semibold">
                  Mes del Período
                </Label>
                <Select value={localDatos.mes} onValueChange={(value) => handleChange("mes", value)}>
                  <SelectTrigger id="mes" className="h-12 text-base">
                    <SelectValue placeholder="Seleccione mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((mes) => (
                      <SelectItem key={mes} value={mes} className="text-base">
                        {mes}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="fechaCorte" className="text-base font-semibold">
                  Fecha de Corte
                </Label>
                <Input
                  id="fechaCorte"
                  type="date"
                  value={localDatos.fechaCorte}
                  onChange={(e) => handleChange("fechaCorte", e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t space-y-4">
            {isFormComplete(localDatos) ? (
              <Button
                onClick={handleContinue}
                size="lg"
                className="w-full h-12 text-base gap-2"
              >
                Continuar a Nómina
                <ArrowRight className="h-5 w-5" />
              </Button>
            ) : (
              <div className="p-4 bg-muted/50 border border-dashed rounded-lg">
                <p className="text-sm text-center text-muted-foreground">
                  Complete todos los campos para continuar
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
