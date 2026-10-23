import React from 'react';
import useScreen from '@/hooks/useScreen';
import clsx from 'clsx';
import { ReporteMensualItem } from '@/pages/ReportesCombinados';

interface Props {
  data: ReporteMensualItem[];
}

const MonthlyTable: React.FC<Props> = ({ data }) => {
  const screen = useScreen();
  
  // Filtrar los días de meses anteriores o siguientes
  const filteredData = React.useMemo(() => {
    return data.filter(row => {
      // Mantener subtotales, totales y días del mes actual
      return row.esSubtotal || row.esTotal || !row.esFueraDelMes;
    });
  }, [data]);

  // Obtener los números de semana de los datos
  const weekNumbers = React.useMemo(() => {
    const map = new Map<number, number>();
    let semana = 1;
    let acumuladorSemana: ReporteMensualItem[] = [];

    filteredData.forEach((row, i) => {
      if (row.esSubtotal) {
        // Solo agregar número si hubo días válidos antes del subtotal
        const tieneDiasValidos = acumuladorSemana.some(r => !r.esSubtotal && !r.esTotal);

        if (tieneDiasValidos) {
          map.set(i, semana++);
        }

        acumuladorSemana = []; // Reiniciar para la siguiente semana
      } else if (!row.esTotal) {
        acumuladorSemana.push(row);
      }
    });

    return map;
  }, [filteredData]);

  // Depurar los datos para verificar si los subtotales tienen semana definida
  React.useEffect(() => {
    console.log('Subtotales encontrados:', filteredData.filter(d => d.esSubtotal));
    console.log('Números de semana calculados:', weekNumbers);
  }, [filteredData, weekNumbers]);

  /* ---------- Dispositivos móviles y tablets ------------- */
  if (screen !== "desktop") {
    if (!filteredData.length)
      return (
          <p className="text-center text-gray-400 py-6">
            No hay datos disponibles.
          </p>
      );

    return (
        <div className="flex flex-col gap-3">
          {filteredData.map((row, i) =>
              row.esSubtotal || row.esTotal ? (
                  /* SUBTOTALES Y TOTAL */
                  <div
                      key={i}
                      className={clsx(
                          "rounded-lg p-2 text-sm font-bold",
                          row.esSubtotal ? "bg-amber-300/90" : "bg-blue-600 text-white"
                      )}
                  >
                    {row.esSubtotal
                        ? "SUBTOTAL"
                        : "TOTAL MENSUAL"}
                  </div>
              ) : (
                  /* DÍAS • TARJETA */
                  <div
                      key={i}
                      className="rounded-xl shadow-sm p-4 flex flex-col gap-2 bg-white"
                  >
                    <header className="flex justify-between items-center mb-1">
                <span className="font-semibold text-blue-900">
                  {row.dia}
                </span>
                      <span className="text-xs text-gray-500">{row.fecha}</span>
                    </header>

                    {/* Turnos existentes */}
                    {row.matutino && (
                        <Turno label="Matutino" val={row.matutino} />
                    )}
                    {row.vespertino && (
                        <Turno label="Vespertino" val={row.vespertino} />
                    )}
                    {row.nocturno && (
                        <Turno label="Nocturno" val={row.nocturno} />
                    )}
                    {row.jornadaAcumulada && (
                        <Turno
                            label="Jornada acum."
                            val={row.jornadaAcumulada}
                            simple
                        />
                    )}
                  </div>
              )
          )}
        </div>
    );
  }

  /* ---------- Dispositivos de Escritorio ------- */
  return (
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full divide-y divide-gray-200">
          {/* CABECERA AZUL */}
          <thead>
          <tr className="bg-blue-600 text-white text-center">
            <th rowSpan={2} className="px-1 sm:px-2 py-1 sm:py-2 font-semibold border border-white">Día</th>
            <th rowSpan={2} className="px-1 sm:px-2 py-1 sm:py-2 font-semibold border border-white">Fecha</th>
            <th colSpan={3} className="px-1 sm:px-2 py-1 sm:py-2 font-semibold border border-white">Matutino</th>
            <th colSpan={3} className="px-1 sm:px-2 py-1 sm:py-2 font-semibold border border-white">Vespertino</th>
            <th colSpan={2} className="px-1 sm:px-2 py-1 sm:py-2 font-semibold border border-white">Jornada Acumulada</th>
            <th colSpan={2} className="px-1 sm:px-2 py-1 sm:py-2 font-semibold border border-white">Nocturno</th>
          </tr>
          <tr className="bg-blue-600 text-white text-center">
            {['R','D','V','R','D','V','R','V','R','V'].map((h, i) => (
                <th key={`${h}-${i}`} className="px-0.5 sm:px-1 py-0.5 sm:py-1 font-semibold border border-white">{h}</th>
            ))}
          </tr>
          </thead>

          {/* CUERPO */}
          <tbody>
          {filteredData.map((row, idx) => {
            const isSubtotal = row.esSubtotal;
            const isTotal    = row.esTotal;

            const base = isSubtotal || isTotal
                ? 'bg-yellow-400 font-bold text-center'
                : idx % 2 === 0
                    ? 'bg-white'
                    : 'bg-gray-50';

            return (
                <tr key={idx} className={base}>
                  {/* Día / Etiquetas de subtotal */}
                  <td className="border px-0.5 sm:px-1 py-0.5 sm:py-1 text-center whitespace-nowrap">
                    {isSubtotal ? "SUBTOTAL" : row.dia}
                  </td>
                  <td className="border px-0.5 sm:px-1 py-0.5 sm:py-1 text-center whitespace-nowrap">
                    {isSubtotal ? '' : row.fecha}
                  </td>

                  {/* Matutino */}
                  <td className="border px-0.5 sm:px-1 py-0.5 sm:py-1 text-center">{row.matutino?.R ?? '-'}</td>
                  <td className="border px-0.5 sm:px-1 py-0.5 sm:py-1 text-center">{row.matutino?.D ?? '-'}</td>
                  <td className="border px-0.5 sm:px-1 py-0.5 sm:py-1 text-center">{row.matutino?.V ?? '-'}</td>

                  {/* Vespertino */}
                  <td className="border px-0.5 sm:px-1 py-0.5 sm:py-1 text-center">{row.vespertino?.R ?? '-'}</td>
                  <td className="border px-0.5 sm:px-1 py-0.5 sm:py-1 text-center">{row.vespertino?.D ?? '-'}</td>
                  <td className="border px-0.5 sm:px-1 py-0.5 sm:py-1 text-center">{row.vespertino?.V ?? '-'}</td>

                  {/* Jornada acumulada */}
                  <td className="border px-0.5 sm:px-1 py-0.5 sm:py-1 text-center">{row.jornadaAcumulada?.R ?? '-'}</td>
                  <td className="border px-0.5 sm:px-1 py-0.5 sm:py-1 text-center">{row.jornadaAcumulada?.V ?? '-'}</td>

                  {/* Nocturno */}
                  <td className="border px-0.5 sm:px-1 py-0.5 sm:py-1 text-center">{row.nocturno?.R ?? '-'}</td>
                  <td className="border px-0.5 sm:px-1 py-0.5 sm:py-1 text-center">{row.nocturno?.V ?? '-'}</td>
                </tr>
            );
          })}
          </tbody>
        </table>
      </div>
  );
};

/* --- sub-componente compactador de filas --- */
function Turno({
                 label,
                 val,
                 simple = false,
               }: {
  label: string;
  val: { R: number; D?: number; V: number };
  simple?: boolean;
}) {
  return (
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        {simple ? (
            <span className="font-medium">
          R:{val.R} ▪ V:{val.V}
        </span>
        ) : (
            <span className="font-medium">
          R:{val.R} ▪ D:{val.D} ▪ V:{val.V}
        </span>
        )}
      </div>
  );
}

export default MonthlyTable;