import React, { useCallback } from 'react';
import axios from 'axios';
// Importar bibliotecas para exportación
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import SectionCard from '../components/SectionCard';
import MonthlyTable from '@/components/MonthlyTable';
import WeeklyTable from '@/components/WeeklyTable';
import { useAuth } from '@/auth/AuthContext';
import { toast } from 'react-toastify';

const formatDate = (date: string | Date): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

interface Medicamento {
  nombre: string;
  cantidad: number;
  [key: string]: any;
}

// Componentes reutilizables
type ReportTableProps = {
  data: any[];
  columns: { key: string; header: string }[];
  renderRow?: (item: any, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
};

const ReportTable: React.FC<ReportTableProps> = ({
  data,
  columns,
  renderRow,
  emptyMessage = "No hay datos disponibles.",
  className = "",
}) => {
  // Detectar móvil y tablet
  const [screenSize, setScreenSize] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  React.useEffect(() => {
    const check = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width >= 640 && width <= 768) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (screenSize === 'mobile' || screenSize === 'tablet') {
    // Cards para móvil y tablet
    if (!data.length) {
      return <div className={`py-6 text-center text-gray-400 ${className}`}>{emptyMessage}</div>;
    }
    return (
      <div className="flex flex-col gap-3">
        {data.map((item, i: number) =>
          Array.isArray(item.medicamentos)
            ? item.medicamentos.map((med: Medicamento, _idx: number) => (
                <div key={_idx} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
                  {columns.map((col) => {
                    let value =
                      col.key === "medicamento"
                        ? med.nombre
                        : col.key === "cantidad"
                        ? med.cantidad
                        : col.key === "personal"
                        ? item.personal?.nombre || "N/A"
                        : item[col.key] ?? "-";
                    return (
                      <div key={col.key} className="flex justify-between text-sm">
                        <span className="font-medium text-blue-900">{col.header}</span>
                        <span className="text-gray-700 text-right break-all">{value}</span>
                      </div>
                    );
                  })}
                </div>
              ))
            : (
                <div key={i} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
                  {columns.map((col) => (
                    <div key={col.key} className="flex justify-between text-sm">
                      <span className="font-medium text-blue-900">{col.header}</span>
                      <span className="text-gray-700 text-right break-all">{item[col.key] ?? "-"}</span>
                    </div>
                  ))}
                </div>
              )
        )}
      </div>
    );
  }

  // Tabla en escritorio
  return (
    <div className="overflow-x-auto md:overflow-visible rounded-lg">
      <table className="w-full md:min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-50 sticky top-0 z-10">
          <tr>
            {columns.map(column => (
              <th key={column.key} className="px-2 sm:px-3 md:px-5 py-1 sm:py-2 text-left text-xs font-bold text-blue-900 uppercase whitespace-nowrap">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-gray-400 py-4">
                {emptyMessage}
              </td>
            </tr>
          ) : renderRow
            ? data.map((item, index) => renderRow(item, index))
            : data.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map(col => (
                  <td key={col.key} className="px-2 sm:px-3 md:px-5 py-1 sm:py-2">
                    {item[col.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

type ReportSectionProps = {
  title: string;
  onExportPDF: () => void;
  children: React.ReactNode;
};

const ReportSection: React.FC<ReportSectionProps> = ({
  title,
  onExportPDF,
  children
}) => {
  return (
    <SectionCard>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-0">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={onExportPDF}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
          >
            Exportar a PDF
          </button>
        </div>
      </div>
      {children}
    </SectionCard>
  );
};

type EntregaDetalle = {
  id: number;
  cantidad: number;
  medicamento: { id: number; nombre: string };
};
type Entrega = {
  id: number;
  clave: string;
  fecha: string;
  general: number;
  dental: number;
  vales: number;
  paciente: { id: number; nombre: string; curp: string };
  doctor: { id: number; nombre: string; especialidad: string };
  personal: { id: number; nombre: string; puesto: string };
  entregaDetalles: EntregaDetalle[];
};
type MedicamentoItem = { id: number; nombre: string; cantidad: number; };
type ReportItem = {
  clave: string;
  fecha: string;
  totalEntregas: number;
  medicamentos: MedicamentoItem[];
  totalGeneral: number;
  totalDental: number;
  totalVales: number;
  personal?: { id: number; nombre: string; puesto: string };
  turno?: string;
};
export type ReporteMensualItem = {
  dia: string; // L, M, M, J, V, S, D
  fecha: string;
  matutino?: { R: number; D: number; V: number };
  vespertino?: { R: number; D: number; V: number };
  jornadaAcumulada?: { R: number; V: number };
  nocturno?: { R: number; V: number };
  esSubtotal?: boolean;
  esTotal?: boolean;
  semana?: number; // Número de la semana para los subtotales
  esFueraDelMes?: boolean; // Indica si el día pertenece a un mes diferente al seleccionado
};


function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Función para convertir una fecha string a objeto Date con hora local
function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();

  // Manejar formato ISO directamente
  if (dateString.includes('T')) {
    return new Date(dateString);
  }

  // Manejar formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Manejar formato dd/mm/yyyy
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateString);
}

// Función para generar el reporte mensual con el formato requerido
const generateMonthlyReport = (data: ReportItem[], selectedDate?: string): ReporteMensualItem[] => {
  // Si no hay fecha seleccionada y no hay datos, no podemos generar el reporte
  if (!selectedDate && !data.length) return [];

  // Determinar el mes y año para el reporte
  let reportMonth: number;
  let reportYear: number;

  if (selectedDate) {
    // Usar la fecha seleccionada
    const selectedDateObj = parseLocalDate(selectedDate);
    reportMonth = selectedDateObj.getMonth();
    reportYear = selectedDateObj.getFullYear();
  } else if (data.length) {
    // Si no hay fecha seleccionada, pero hay datos, usar la fecha del primer dato
    const firstDateObj = parseLocalDate(data[0].fecha);
    reportMonth = firstDateObj.getMonth();
    reportYear = firstDateObj.getFullYear();
  } else {
    const now = new Date();
    reportMonth = now.getMonth();
    reportYear = now.getFullYear();
  }
  const dayOfWeekMap = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Generar todas las fechas del mes
  const allDatesInMonth: Date[] = [];
  const firstDayOfMonth = new Date(reportYear, reportMonth, 1);
  const lastDayOfMonth = new Date(reportYear, reportMonth + 1, 0);

  // Determinar el primer día de la semana (lunes) para el primer día del mes
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado

  // Añadir días del mes anterior para completar la primera semana
  if (firstDayOfWeek !== 1) { // Si el mes no comienza en lunes
    const daysToAdd = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Calcular cuántos días añadir
    for (let i = daysToAdd; i > 0; i--) {
      const prevMonthDay = new Date(reportYear, reportMonth, 1 - i);
      allDatesInMonth.push(prevMonthDay);
    }
  }

  // Añadir todos los días del mes actual
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    allDatesInMonth.push(new Date(reportYear, reportMonth, day));
  }

  const lastDayOfWeek = lastDayOfMonth.getDay();
  if (lastDayOfWeek !== 0) {
    const daysToAdd = 7 - lastDayOfWeek;
    for (let i = 1; i <= daysToAdd; i++) {
      const nextMonthDay = new Date(reportYear, reportMonth + 1, i);
      allDatesInMonth.push(nextMonthDay);
    }
  }

  // Crear un mapa para almacenar las filas por día
  const rowsByDay = new Map<string, ReporteMensualItem>();

  // Inicializar filas para cada día del mes
  allDatesInMonth.forEach(date => {
    const jsDay = date.getDay(); // 0 = domingo, 1 = lunes, ...
    // Convertir de día JS a índice en nuestro array (0=Lunes, 1=Martes,.....)
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
    const dayOfWeekAbbr = dayOfWeekMap[dayIndex];
    const formattedDate = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const dateKey = getLocalDateKey(date);
    const isWeekend = jsDay === 0 || jsDay === 6; // 0 = domingo, 6 = sábado

    // Determinar si el día pertenece al mes seleccionado o a un mes superior
    const isOtherMonth = date.getMonth() !== reportMonth;

    // Inicializar la fila según sea día de semana o fin de semana
    if (isWeekend) {
      rowsByDay.set(dateKey, {
        dia: dayOfWeekAbbr,
        fecha: formattedDate,
        jornadaAcumulada: { R: 0, V: 0 },
        esFueraDelMes: isOtherMonth
      });
    } else {
      rowsByDay.set(dateKey, {
        dia: dayOfWeekAbbr,
        fecha: formattedDate,
        matutino: { R: 0, D: 0, V: 0 },
        vespertino: { R: 0, D: 0, V: 0 },
        nocturno: { R: 0, V: 0 },
        esFueraDelMes: isOtherMonth
      });
    }
  });

  // Generar el reporte mensual
  const monthlyReport: ReporteMensualItem[] = [];
  let weeklySubtotal: ReporteMensualItem = {
    dia: 'SUBTOTAL',
    fecha: '',
    matutino: { R: 0, D: 0, V: 0 },
    vespertino: { R: 0, D: 0, V: 0 },
    jornadaAcumulada: { R: 0, V: 0 },
    nocturno: { R: 0, V: 0 },
    esSubtotal: true
  };

  let monthlyTotal: ReporteMensualItem = {
    dia: 'TOTAL',
    fecha: '',
    matutino: { R: 0, D: 0, V: 0 },
    vespertino: { R: 0, D: 0, V: 0 },
    jornadaAcumulada: { R: 0, V: 0 },
    nocturno: { R: 0, V: 0 },
    esTotal: true
  };

  // Procesar cada entrega individualmente
  data.forEach(item => {
    const date = parseLocalDate(item.fecha);
    const dateKey = getLocalDateKey(date);

    // Verificar si esta fecha está dentro del mes seleccionado
    if (rowsByDay.has(dateKey)) {
      const row = rowsByDay.get(dateKey)!;
      const jsDay = date.getDay();
      const isWeekend = jsDay === 0 || jsDay === 6;

      // Determinar el turno basado en la hora
      const hour = date.getHours();
      let turno;
      if (hour >= 7 && hour <= 14) {
        turno = "Matutino";
      } else if (hour >= 14 && hour <= 21) {
        turno = "Vespertino";
      } else if (hour >= 21 || hour <= 7) {
        turno = "Nocturno";
      } else {
        turno = "Matutino";
      }

      // Actualizar los contadores según el tipo de día y turno
      if (isWeekend) {
        // Para fines de semana, solo actualizar Jornada Acumulada
        if (row.jornadaAcumulada) {
          row.jornadaAcumulada.R += item.totalGeneral;
          row.jornadaAcumulada.V += item.totalVales;

          // Actualizar subtotales semanales y totales mensuales
          if (weeklySubtotal.jornadaAcumulada) {
            weeklySubtotal.jornadaAcumulada.R += item.totalGeneral;
            weeklySubtotal.jornadaAcumulada.V += item.totalVales;
          }

          if (monthlyTotal.jornadaAcumulada) {
            monthlyTotal.jornadaAcumulada.R += item.totalGeneral;
            monthlyTotal.jornadaAcumulada.V += item.totalVales;
          }
        }
      } else {
        // Para días de semana, actualizar según el turno
        if (turno === 'Matutino' && row.matutino) {
          row.matutino.R += item.totalGeneral;
          row.matutino.D += item.totalDental;
          row.matutino.V += item.totalVales;

          // Actualizar subtotales semanales y totales mensuales
          if (weeklySubtotal.matutino) {
            weeklySubtotal.matutino.R += item.totalGeneral;
            weeklySubtotal.matutino.D += item.totalDental;
            weeklySubtotal.matutino.V += item.totalVales;
          }

          if (monthlyTotal.matutino) {
            monthlyTotal.matutino.R += item.totalGeneral;
            monthlyTotal.matutino.D += item.totalDental;
            monthlyTotal.matutino.V += item.totalVales;
          }
        } else if (turno === 'Vespertino' && row.vespertino) {
          row.vespertino.R += item.totalGeneral;
          row.vespertino.D += item.totalDental;
          row.vespertino.V += item.totalVales;

          // Actualizar subtotales semanales y totales mensuales
          if (weeklySubtotal.vespertino) {
            weeklySubtotal.vespertino.R += item.totalGeneral;
            weeklySubtotal.vespertino.D += item.totalDental;
            weeklySubtotal.vespertino.V += item.totalVales;
          }

          if (monthlyTotal.vespertino) {
            monthlyTotal.vespertino.R += item.totalGeneral;
            monthlyTotal.vespertino.D += item.totalDental;
            monthlyTotal.vespertino.V += item.totalVales;
          }
        } else if (turno === 'Nocturno' && row.nocturno) {
          row.nocturno.R += item.totalGeneral;
          row.nocturno.V += item.totalVales;

          // Actualizar subtotales semanales y totales mensuales
          if (weeklySubtotal.nocturno) {
            weeklySubtotal.nocturno.R += item.totalGeneral;
            weeklySubtotal.nocturno.V += item.totalVales;
          }

          if (monthlyTotal.nocturno) {
            monthlyTotal.nocturno.R += item.totalGeneral;
            monthlyTotal.nocturno.V += item.totalVales;
          }
        }
      }
    }
  });

  // Añadir todas las filas al reporte en orden
  let dayCount = 0;
  let currentWeekDays: ReporteMensualItem[] = [];

  // Determinar el primer día de la semana (lunes) para el primer día del mes
  // Usando firstDayOfMonth y firstDayOfWeek ya declarados anteriormente

  // Calcular el primer lunes del mes
  const firstMonday = new Date(firstDayOfMonth);
  // Si el primer día del mes no es lunes, avanzar hasta el primer lunes del mes
  const daysToAdd = firstDayOfWeek === 0 ? 1 : (firstDayOfWeek === 1 ? 0 : 8 - firstDayOfWeek);
  firstMonday.setDate(firstMonday.getDate() + daysToAdd);

  allDatesInMonth.forEach(date => {
    const dateKey = getLocalDateKey(date);
    if (rowsByDay.has(dateKey)) {
      const dayData = rowsByDay.get(dateKey)!;
      monthlyReport.push(dayData);
      currentWeekDays.push(dayData);
      dayCount++;

      // Añadir subtotal semanal al final de cada semana (domingo)
      // o cuando cambiamos de semana (lunes)
      const jsDay = date.getDay(); // 0 = domingo
      const isMonday = jsDay === 1;

      // Calcular el número de la semana para la fecha actual
      const weekNumber = (() => {
        // Calcular qué semana es basado en la diferencia de días desde el primer lunes
        const daysDiff = Math.floor((date.getTime() - firstMonday.getTime()) / (24 * 60 * 60 * 1000));

        // Si la fecha es anterior al primer lunes, es semana 1 (primera semana del mes)
        if (daysDiff < 0) {
          return 1;
        }

        return Math.floor(daysDiff / 7) + 1; // +1 porque las semanas empiezan en 1
      })();

      if (jsDay === 0 || (isMonday && currentWeekDays.length > 1)) {
        // Si es lunes, procesamos los días acumulados de la semana anterior
        let subtotalWeekNumber = weekNumber;

        if (isMonday && currentWeekDays.length > 1) {
          // Eliminar el día actual (lunes) de currentWeekDays para el cálculo del subtotal
          currentWeekDays.pop();

          // Para lunes, el subtotal debe usar el número de semana anterior
          subtotalWeekNumber = weekNumber - 1;
          // Asegurar que no sea menor que 1
          if (subtotalWeekNumber < 1) subtotalWeekNumber = 1;
        }

        // Calcular el subtotal semanal basado en los días de la semana actual
        const calculatedSubtotal: ReporteMensualItem = {
          dia: 'SUBTOTAL',
          fecha: '',
          matutino: { R: 0, D: 0, V: 0 },
          vespertino: { R: 0, D: 0, V: 0 },
          jornadaAcumulada: { R: 0, V: 0 },
          nocturno: { R: 0, V: 0 },
          esSubtotal: true,
          semana: subtotalWeekNumber // Usar el número de la semana correcto para el subtotal
        };

        // Sumar los valores de cada día de la semana
        currentWeekDays.forEach(day => {
          // Matutino
          if (day.matutino && calculatedSubtotal.matutino) {
            calculatedSubtotal.matutino.R += day.matutino.R;
            calculatedSubtotal.matutino.D += day.matutino.D;
            calculatedSubtotal.matutino.V += day.matutino.V;
          }

          // Vespertino
          if (day.vespertino && calculatedSubtotal.vespertino) {
            calculatedSubtotal.vespertino.R += day.vespertino.R;
            calculatedSubtotal.vespertino.D += day.vespertino.D;
            calculatedSubtotal.vespertino.V += day.vespertino.V;
          }

          // Jornada Acumulada
          if (day.jornadaAcumulada && calculatedSubtotal.jornadaAcumulada) {
            calculatedSubtotal.jornadaAcumulada.R += day.jornadaAcumulada.R;
            calculatedSubtotal.jornadaAcumulada.V += day.jornadaAcumulada.V;
          }

          // Nocturno
          if (day.nocturno && calculatedSubtotal.nocturno) {
            calculatedSubtotal.nocturno.R += day.nocturno.R;
            calculatedSubtotal.nocturno.V += day.nocturno.V;
          }
        });

        console.log(`Añadiendo subtotal para semana ${calculatedSubtotal.semana} en día ${jsDay === 0 ? 'domingo' : 'lunes'}`);

        monthlyReport.push(calculatedSubtotal);

        // Si es lunes, volver a añadir el día actual a currentWeekDays después de calcular el subtotal
        if (isMonday && dayData) {
          currentWeekDays = [dayData];
        } else {
          // Reiniciar la lista de días de la semana actual
          currentWeekDays = [];
        }
      }
    }
  });

  // Añadir último subtotal semanal si el mes no termina en domingo
  const monthEndDate = new Date(reportYear, reportMonth + 1, 0);
  if (monthEndDate.getDay() !== 0 && currentWeekDays.length > 0) {
    // Calcular el número de la semana para el último día del mes
    const lastWeekNumber = (() => {
      // Calcular qué semana es basado en la diferencia de días desde el primer lunes
      const daysDiff = Math.floor((monthEndDate.getTime() - firstMonday.getTime()) / (24 * 60 * 60 * 1000));

      // Si la fecha es anterior al primer lunes, es semana 1 (primera semana del mes)
      if (daysDiff < 0) {
        return 1;
      }

      return Math.floor(daysDiff / 7) + 1; // +1 porque las semanas empiezan en 1
    })();

    // Calcular el subtotal para la última semana incompleta
    const lastWeekSubtotal: ReporteMensualItem = {
      dia: 'SUBTOTAL',
      fecha: '',
      matutino: { R: 0, D: 0, V: 0 },
      vespertino: { R: 0, D: 0, V: 0 },
      jornadaAcumulada: { R: 0, V: 0 },
      nocturno: { R: 0, V: 0 },
      esSubtotal: true,
      semana: lastWeekNumber // Guardar el número de semana en el subtotal
    };

    // Log para depuración
    console.log(`Añadiendo subtotal final para semana ${lastWeekNumber}`);

    // Sumar los valores de cada día de la última semana
    currentWeekDays.forEach(day => {
      // Matutino
      if (day.matutino && lastWeekSubtotal.matutino) {
        lastWeekSubtotal.matutino.R += day.matutino.R;
        lastWeekSubtotal.matutino.D += day.matutino.D;
        lastWeekSubtotal.matutino.V += day.matutino.V;
      }

      // Vespertino
      if (day.vespertino && lastWeekSubtotal.vespertino) {
        lastWeekSubtotal.vespertino.R += day.vespertino.R;
        lastWeekSubtotal.vespertino.D += day.vespertino.D;
        lastWeekSubtotal.vespertino.V += day.vespertino.V;
      }

      // Jornada Acumulada
      if (day.jornadaAcumulada && lastWeekSubtotal.jornadaAcumulada) {
        lastWeekSubtotal.jornadaAcumulada.R += day.jornadaAcumulada.R;
        lastWeekSubtotal.jornadaAcumulada.V += day.jornadaAcumulada.V;
      }

      // Nocturno
      if (day.nocturno && lastWeekSubtotal.nocturno) {
        lastWeekSubtotal.nocturno.R += day.nocturno.R;
        lastWeekSubtotal.nocturno.V += day.nocturno.V;
      }
    });

    monthlyReport.push(lastWeekSubtotal);
  }

  // Calcular y añadir total mensual al final
  const calculatedMonthlyTotal: ReporteMensualItem = {
    dia: 'TOTAL',
    fecha: '',
    matutino: { R: 0, D: 0, V: 0 },
    vespertino: { R: 0, D: 0, V: 0 },
    jornadaAcumulada: { R: 0, V: 0 },
    nocturno: { R: 0, V: 0 },
    esTotal: true
  };

  // Sumar los valores de cada día del mes (excluyendo los subtotales)
  allDatesInMonth.forEach(date => {
    const dateKey = getLocalDateKey(date);
    if (rowsByDay.has(dateKey)) {
      const day = rowsByDay.get(dateKey)!;

      // Matutino
      if (day.matutino && calculatedMonthlyTotal.matutino) {
        calculatedMonthlyTotal.matutino.R += day.matutino.R;
        calculatedMonthlyTotal.matutino.D += day.matutino.D;
        calculatedMonthlyTotal.matutino.V += day.matutino.V;
      }

      // Vespertino
      if (day.vespertino && calculatedMonthlyTotal.vespertino) {
        calculatedMonthlyTotal.vespertino.R += day.vespertino.R;
        calculatedMonthlyTotal.vespertino.D += day.vespertino.D;
        calculatedMonthlyTotal.vespertino.V += day.vespertino.V;
      }

      // Jornada Acumulada
      if (day.jornadaAcumulada && calculatedMonthlyTotal.jornadaAcumulada) {
        calculatedMonthlyTotal.jornadaAcumulada.R += day.jornadaAcumulada.R;
        calculatedMonthlyTotal.jornadaAcumulada.V += day.jornadaAcumulada.V;
      }

      // Nocturno
      if (day.nocturno && calculatedMonthlyTotal.nocturno) {
        calculatedMonthlyTotal.nocturno.R += day.nocturno.R;
        calculatedMonthlyTotal.nocturno.V += day.nocturno.V;
      }
    }
  });

  monthlyReport.push(calculatedMonthlyTotal);

  // Verificar que no hay subtotales duplicados con el mismo número de la semana
  const subtotals = monthlyReport.filter(item => item.esSubtotal);
  console.log('Subtotales encontrados:', subtotals.length);
  subtotals.forEach((subtotal, i) => {
    console.log(`Subtotal #${i + 1}: semana=${subtotal.semana}`);
  });

  // Depuración para verificar que los días de otros meses están marcados correctamente
  const otherMonthDays = monthlyReport.filter(item => item.esFueraDelMes && !item.esSubtotal && !item.esTotal);
  console.log(`Días de otros meses: ${otherMonthDays.length}`);
  otherMonthDays.forEach((day, i) => {
    console.log(`Día de otro mes #${i + 1}: ${day.dia} ${day.fecha}`);
  });

  // Depuración para verificar que los días del mes seleccionado están marcados correctamente
  const selectedMonthDays = monthlyReport.filter(item => !item.esFueraDelMes && !item.esSubtotal && !item.esTotal);
  console.log(`Días del mes seleccionado: ${selectedMonthDays.length}`);
  console.log(`Primer día del mes: ${selectedMonthDays[0]?.dia} ${selectedMonthDays[0]?.fecha}`);
  console.log(`Último día del mes: ${selectedMonthDays[selectedMonthDays.length - 1]?.dia} ${selectedMonthDays[selectedMonthDays.length - 1]?.fecha}`);

  return monthlyReport;
};


  // Función para preparar datos para exportación
const prepareDataForExport = (data: any[], reportType: 'daily' | 'monthly' | 'weekly' | 'specificDay', selectedDate?: string) => {
  // Para reportes diarios y de día específico, necesitamos expandir los medicamentos
  if (reportType === 'daily' || reportType === 'specificDay') {
    const exportData: any[] = [];

    data.forEach(item => {
      // Determinar la fecha a mostrar
      let displayDate = formatDate(item.fecha);

      if (!item.medicamentos || item.medicamentos.length === 0) {
        // Si no hay medicamentos, añadir una fila con los totales
        exportData.push({
          Fecha: displayDate,
          Clave: item.clave,
          Medicamento: 'N/A',
          Cantidad: 0,
          General: item.totalGeneral,
          Dental: item.totalDental,
          Vales: item.totalVales,
          Encargado: item.personal?.nombre || 'N/A',
        });
      } else {
        // Sí hay medicamentos, añadir una fila por cada medicamento
        item.medicamentos.forEach((med: Medicamento, i: number) => {
          exportData.push({
            Fecha: displayDate,
            Clave: item.clave,
            Medicamento: med.nombre,
            Cantidad: med.cantidad,
            General: i === 0 ? item.totalGeneral : '',
            Dental: i === 0 ? item.totalDental : '',
            Vales: i === 0 ? item.totalVales : '',
            Encargado: i === 0 ? (item.personal?.nombre || 'N/A') : '',
          });
        });
      }
    });

    return exportData;
  }
  // Para reporte mensual, usamos un formato similar a los reportes diarios
  else if (reportType === 'monthly' || reportType === 'weekly') {
    const exportData: any[] = [];

    // Para reportes mensuales y semanales, usar las mismas fechas que en el resumen mensual
    let monthlyDates: {[key: string]: string} = {};
    if (selectedDate) {
      const monthlyData = generateMonthlyReport(data, selectedDate);
      // Crear un mapa de fechas locales a fechas formateadas del reporte mensual
      monthlyData.forEach(item => {
        if (!item.esSubtotal && !item.esTotal) {
          // Convertir la fecha formateada de vuelta a un objeto Date
          const parts = item.fecha.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            const date = new Date(year, month, day);
            // Usar el formato local como clave
            const localDateKey = getLocalDateKey(date);
            monthlyDates[localDateKey] = formatDate(item.fecha);
          }
        }
      });
    }

    data.forEach(item => {
      // Determinar la fecha a mostrar
      let displayDate;
      if (selectedDate) {
        // Para reportes mensuales y semanales, usar la fecha del resumen mensual si está disponible
        const itemDate = parseLocalDate(item.fecha);
        const localDateKey = getLocalDateKey(itemDate);
        displayDate = monthlyDates[localDateKey] || formatDate(item.fecha);
      } else {
        // Si no hay fecha seleccionada, usar la fecha formateada normalmente
        displayDate = formatDate(item.fecha);
      }

      if (!item.medicamentos || item.medicamentos.length === 0) {
        // Si no hay medicamentos, añadir una fila con los totales
        exportData.push({
          Fecha: displayDate,
          Clave: item.clave,
          Medicamento: 'N/A',
          Cantidad: 0,
          General: item.totalGeneral,
          Dental: item.totalDental,
          Vales: item.totalVales,
          Encargado: item.personal?.nombre || 'N/A',
        });
      } else {
        // Sí hay medicamentos, añadir una fila por cada medicamento
        item.medicamentos.forEach((med: Medicamento, i: number) => {
          exportData.push({
            Fecha: displayDate,
            Clave: item.clave,
            Medicamento: med.nombre,
            Cantidad: med.cantidad,
            General: i === 0 ? item.totalGeneral : '',
            Dental: i === 0 ? item.totalDental : '',
            Vales: i === 0 ? item.totalVales : '',
            Encargado: i === 0 ? (item.personal?.nombre || 'N/A') : '',
          });
        });
      }
    });

    return exportData;
  }

  return [];
};

const ReportesCombinados = () => {
  // Estado para el tipo de reporte (diario, mensual, día específico)
  const [reportType, setReportType] = React.useState<'daily' | 'monthly' | 'weekly' | 'specificDay'>('daily');

  // Estado para la fecha seleccionada
  const [selectedDate, setSelectedDate] = React.useState<string>('');

  // Estados para selección de mes en reportes mensuales
  const [selectedMonth, setSelectedMonth] = React.useState<string>('');
  const [selectedWeek, setSelectedWeek] = React.useState<number>(0);

  // Estado para los datos del reporte
  const [reportData, setReportData] = React.useState<ReportItem[]>([]);


  // Estados para carga y errores
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState<number>(0);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  // Estado para paginación
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [itemsPerPage] = React.useState<number>(10);

  const { user } = useAuth();
  const formatDate = (s: string) => {
    const date = parseLocalDate(s);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  // Función para verificar si dos fechas son el mismo día
  const isSameDay = (date1: string, date2: string) => {
    const d1 = parseLocalDate(date1);
    const d2 = parseLocalDate(date2);
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };


  // Función para verificar si una fecha está en el mismo mes
  const isSameMonth = (date1: string, date2: string) => {
    const d1 = parseLocalDate(date1);
    const d2 = parseLocalDate(date2);
    return d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  // Función para generar el reporte según el tipo y fecha seleccionados
  const generateReport = useCallback(async (forcedDate?: string, isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Usar el endpoint existente para obtener todas las entregas
      const url = '/api/entregas';

      // Llamar a la API con axios
      const response = await axios.get(url);

      // Verificar si la respuesta tiene una estructura con propiedad data
      const entregas = response.data.data ? response.data.data : response.data;

      // Filtrar los datos según el tipo de reporte y la fecha seleccionada
      let filteredData = [...entregas];

      // Para reportes mensuales, usar el mes actual si no hay fecha seleccionada
      if (reportType === 'monthly' && !selectedDate) {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        filteredData = entregas.filter((item: Entrega) => {
          const itemDate = parseLocalDate(item.fecha);
          return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        });
      }
      // Para reportes diarios, siempre usar la fecha actual si se proporciona forcedDate
      else if (reportType === 'daily' && forcedDate) {
        filteredData = entregas.filter((item: Entrega) => isSameDay(item.fecha, forcedDate));
      }
      // Para reportes de un día específico, filtrar por el día seleccionado
      else if (reportType === 'specificDay' && selectedDate) {
        filteredData = entregas.filter((item: Entrega) => isSameDay(item.fecha, selectedDate));
      }
      // Para otros reportes, filtrar según la fecha seleccionada
      else if (selectedDate) {
        const compareFunc = reportType === 'daily' ? isSameDay : isSameMonth;

        filteredData = entregas.filter((item: Entrega) => compareFunc(item.fecha, selectedDate));
      }

      // Transformar los datos al formato ReportItem
      const reportItems: ReportItem[] = filteredData.map((entrega: Entrega) => {
        // Determinar el turno basado en la hora según los requisitos
        //07:00-14:00 → Matutino, 14:00-21:00 → Vespertino, 21:00-07:00 → Nocturno
        const date = parseLocalDate(entrega.fecha);
        const hour = date.getHours();

        let turno;
        if (hour >= 7 && hour <= 14) {
          turno = "Matutino";
        } else if (hour >= 14 && hour <= 21) {
          turno = "Vespertino";
        } else if (hour >= 21 || hour <= 7) {
          turno = "Nocturno";
        } else {
          turno = "Matutino";
        }

        return {
          clave: entrega.clave,
          fecha: entrega.fecha,
          totalEntregas: 1, // Cada entrega cuenta como 1
          medicamentos: entrega.entregaDetalles.map((detalle: EntregaDetalle) => ({
            id: detalle.medicamento.id,
            nombre: detalle.medicamento.nombre,
            cantidad: detalle.cantidad
          })),
          totalGeneral: entrega.general,
          totalDental: entrega.dental,
          totalVales: entrega.vales,
          personal: entrega.personal,
          turno: turno
        };
      });

      // Actualizar estados con los datos procesados
      setReportData(reportItems);
      setRetryCount(0); // Reiniciar contador de reintentos al tener éxito
      if (isManualRefresh) {
        toast.success('Reporte actualizado correctamente');
      }
    } catch (err) {
      // Si no es una actualización manual y no hemos excedido el límite de reintentos
      if (!isManualRefresh && retryCount < 2) {
        setRetryCount(prev => prev + 1);
        toast.warning('Reintentando generar el reporte...');
        // Reintentar después de un breve retraso
        setTimeout(() => void generateReport(forcedDate), 1500);
      } else {
        setError("Error al generar el reporte. Intente nuevamente.");
        toast.error('Error al generar el reporte');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [reportType, selectedDate, retryCount]);

  // Efecto para generar el reporte cuando cambia el tipo o la fecha
  React.useEffect(() => {
    // Para reportes diarios, siempre usar la fecha actual
    if (reportType === 'daily') {
      const today = new Date();
      const todayStr = getLocalDateKey(today);
      // No actualizamos selectedDate para no afectar otros reportes
      // Solo generamos el reporte con la fecha actual
      void generateReport(todayStr);
    }
    // Para reportes de un día específico, usar la fecha seleccionada o inicializar con la fecha actual
    else if (reportType === 'specificDay') {
      // Si no hay fecha seleccionada, establecer la fecha actual
      if (!selectedDate) {
        const today = new Date();
        const todayStr = getLocalDateKey(today);
        setSelectedDate(todayStr);
      }

      void generateReport();
    }
    // Si el tipo es mensual, inicializar el selector de mes
    else if (reportType === 'monthly') {
      const today = new Date();

      // Si no hay mes seleccionado, establecer el mes actual
      if (!selectedMonth) {
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        setSelectedMonth(currentMonth);

        // Si no hay fecha seleccionada, establecer el primer día del mes actual
        if (!selectedDate) {
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          setSelectedDate(getLocalDateKey(firstDayOfMonth));
        }
      }

      void generateReport();
    } else {
      void generateReport();
    }
  }, [reportType, selectedDate, selectedMonth, selectedWeek, generateReport]);


  // Funciones para exportación
  const handleExportPDF = (type: 'daily' | 'monthly' | 'weekly' | 'specificDay', title: string) => {
    let reportTypeName = '';

    if (type === 'daily') reportTypeName = 'diario';
    else if (type === 'monthly') reportTypeName = 'mensual';
    else if (type === 'weekly') reportTypeName = 'semanal';
    else if (type === 'specificDay') reportTypeName = 'dia_especifico';

    const filename = `reporte_${reportTypeName}_${getLocalDateKey(new Date())}`;

    // Para reportes mensuales, usar un formato especial que coincida con la tabla en pantalla
    if (type === 'monthly') {
      // Crear un nuevo documento PDF
      const doc = new jsPDF();

      // Añadir logo en la esquina derecha del encabezado para reportes mensuales
      const logoPath = '/Coordinacion.jpg';
      const logoWidth = 55;
      const logoHeight = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoX = pageWidth - logoWidth - 10;
      doc.addImage(logoPath, 'PNG', logoX, 10, logoWidth, logoHeight);

      // Añadir título debajo del logo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');

      doc.text(title, 105, 40, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      // Mostrar nombre de quien elaboró y mes
      doc.text(`Nombre de quien elaboró el informe: ${user?.nombre || 'Usuario'}`, 14, 50);

      // Extraer el mes del reporte
      const monthDate = selectedDate ? parseLocalDate(selectedDate) : new Date();
      const monthString = monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      const capitalizedMonthString = monthString.charAt(0).toUpperCase() + monthString.slice(1);

      // Para reportes mensuales, solo mostrar el mes
      doc.text(`Mes: ${capitalizedMonthString}`, 14, 55);

      // Obtener los datos del reporte
      let processedReportData: ReporteMensualItem[];
      processedReportData = generateMonthlyReport(reportData, selectedDate);

      // Filtrar los días de meses anteriores o siguientes
      processedReportData = processedReportData.filter(row => {
        // Mantener subtotales, totales y días del mes actual
        return row.esSubtotal || row.esTotal || !row.esFueraDelMes;
      });

      // Definir las cabeceras de la tabla
      const tableHead = [
        [
          { content: 'Dia', rowSpan: 2 },
          { content: 'Fecha', rowSpan: 2 },
          { content: 'Matutino', colSpan: 3 },
          { content: 'Vespertino', colSpan: 3 },
          { content: 'Jornada Acumulada', colSpan: 2 },
          { content: 'Nocturno', colSpan: 2 }
        ],
        ['R', 'D', 'V', 'R', 'D', 'V', 'R', 'V', 'R', 'V']
      ];

      // Obtener los números de la semana de los datos
      const weekNumbers = new Map<number, number>();

      // Primero, recopilamos todos los números de la semana con sus índices
      const weekIndices: {idx: number, semana: number}[] = [];
      processedReportData.forEach((row, idx) => {
        if (row.esSubtotal && row.semana) {
          weekIndices.push({idx, semana: row.semana});
        }
      });

      // Ordenamos los números de la semana
      weekIndices.sort((a, b) => a.semana - b.semana);

      weekIndices.forEach(({idx, semana}) => {
        weekNumbers.set(idx, semana);
      });

      // Prepara los datos para la tabla
      const tableBody = processedReportData.map((row: ReporteMensualItem, _: number) => {
        const isSubtotal = row.esSubtotal;
        const isTotal = row.esTotal;

        return [
          isSubtotal ? "SUBTOTAL" : row.dia,
          isSubtotal || isTotal ? '' : row.fecha,
          row.matutino?.R ?? '-',
          row.matutino?.D ?? '-',
          row.matutino?.V ?? '-',
          row.vespertino?.R ?? '-',
          row.vespertino?.D ?? '-',
          row.vespertino?.V ?? '-',
          row.jornadaAcumulada?.R ?? '-',
          row.jornadaAcumulada?.V ?? '-',
          row.nocturno?.R ?? '-',
          row.nocturno?.V ?? '-'
        ];
      });

      // Añadir tabla con formato
      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 60,
        theme: 'grid',
        showHead: 'firstPage',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          halign: 'center'
        },
        headStyles: {
          fillColor: [66, 135, 245],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        willDrawCell: function(data) {
          const row = processedReportData[data.row.index];
          if (row && (row.esSubtotal || row.esTotal)) {
            doc.setFillColor(255, 204, 0); // Color amarillo para subtotales
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
          }
        }
      });

      // Guardar el archivo
      doc.save(`${filename}.pdf`);
    } else {
      const data = prepareDataForExport(reportData, type, selectedDate);
      let columns: { key: string; header: string }[] = [
        { key: 'Fecha', header: 'Fecha' },
        { key: 'Clave', header: 'Clave' },
        { key: 'Medicamento', header: 'Medicamento' },
        { key: 'Cantidad', header: 'Cantidad' },
        { key: 'General', header: 'General' },
        { key: 'Dental', header: 'Dental' },
        { key: 'Vales', header: 'Vales' },
      ];

      if (user?.role === 'ADMIN') {
        columns.splice(2, 0, { key: 'Encargado', header: 'Encargado' });
      }

      // Crear un nuevo documento PDF
      const doc = new jsPDF();

      // Añadir logo en la esquina derecha del encabezado
      const logoPath = '/Coordinacion.jpg';
      const logoWidth = 55;
      const logoHeight = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoX = pageWidth - logoWidth - 10;

      // Añadir título principal
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("COORDINACION MUNICIPAL DE SALUD", 14, 20);

      // Añadir logo después del título
      doc.addImage(logoPath, 'PNG', logoX, 10, logoWidth, logoHeight);

      // Añadir subtítulo
      doc.text("Entega diaria de medicamentos", 14, 30);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      // Mostrar responsable(s)
      doc.text(`Responsable(s): ${user?.nombre || 'Usuario'}`, 14, 40);

      // Determinar el turno basado en la hora actual
      const currentDate = new Date();
      const currentHour = currentDate.getHours();

      let turno;
      if (currentHour >= 7 && currentHour < 14) {
        turno = "Matutino";
      } else if (currentHour >= 14 && currentHour < 21) {
        turno = "Vespertino";
      } else {
        turno = "Nocturno";
      }

      // Mostrar el turno
      doc.text(`Turno: ${turno}`, 14, 45);

      // Extraer la fecha completa del reporte
      const reportDate = selectedDate ? parseLocalDate(selectedDate) : new Date();
      const dateString = reportDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      const capitalizedDateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);

      // Mostrar fecha completa
      doc.text(`Fecha: ${capitalizedDateString}`, 14, 50);

      // Preparar datos para la tabla
      const tableColumn = columns.map(col => col.header);
      const tableRows = data.map(item => columns.map(col => item[col.key]));

      // Calcular totales para General, Dental, Vales y Cantidad
      let totalGeneral = 0;
      let totalDental = 0;
      let totalVales = 0;
      let totalCantidad = 0;

      data.forEach(item => {
        // Convertir a número y sumar solo si es un valor numérico
        const generalValue = Number(item['General']);
        const dentalValue = Number(item['Dental']);
        const valesValue = Number(item['Vales']);
        const cantidadValue = Number(item['Cantidad']);

        if (!isNaN(generalValue)) totalGeneral += generalValue;
        if (!isNaN(dentalValue)) totalDental += dentalValue;
        if (!isNaN(valesValue)) totalVales += valesValue;
        if (!isNaN(cantidadValue)) totalCantidad += cantidadValue;
      });

      // Crear fila de totales
      const totalsRow = Array(columns.length).fill('');
      const medicamentoIndex = columns.findIndex(col => col.key === 'Medicamento');
      const cantidadIndex = columns.findIndex(col => col.key === 'Cantidad');
      const generalIndex = columns.findIndex(col => col.key === 'General');
      const dentalIndex = columns.findIndex(col => col.key === 'Dental');
      const valesIndex = columns.findIndex(col => col.key === 'Vales');

      // Asignar valores a la fila de totales
      if (medicamentoIndex !== -1) totalsRow[medicamentoIndex] = 'TOTAL';
      if (cantidadIndex !== -1) totalsRow[cantidadIndex] = totalCantidad;
      if (generalIndex !== -1) totalsRow[generalIndex] = totalGeneral;
      if (dentalIndex !== -1) totalsRow[dentalIndex] = totalDental;
      if (valesIndex !== -1) totalsRow[valesIndex] = totalVales;
      tableRows.push(totalsRow);

      // Añadir tabla
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 55,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [66, 135, 245],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
      });

      // Guardar el archivo
      doc.save(`${filename}.pdf`);
    }
  };

  // Función para obtener los datos del reporte semanal
  const getWeeklyReportData = (): ReporteMensualItem[] => {
    if (!selectedDate) return [];

    // Generar el reporte mensual completo
    const monthlyReportData = generateMonthlyReport(reportData, selectedDate);

    // Buscar los subtotales para identificar las semanas
    const subtotalIndices: number[] = [];
    monthlyReportData.forEach((item, index) => {
      if (item.esSubtotal) {
        subtotalIndices.push(index);
      }
    });

    // Si no hay suficientes subtotales, devolver un array vacío
    if (subtotalIndices.length <= selectedWeek) return [];

    // Determinar el inicio y fin de la semana seleccionada
    const weekStartIndex = selectedWeek === 0 ? 0 : subtotalIndices[selectedWeek - 1] + 1;
    const weekEndIndex = subtotalIndices[selectedWeek];

    // Obtener los datos de la semana seleccionada
    return monthlyReportData.slice(weekStartIndex, weekEndIndex);
  };

  // Función para obtener las entregas de la semana seleccionada
  const getWeeklyDeliveries = (): ReportItem[] => {
    if (!selectedDate) return [];

    // Obtener los datos de la semana seleccionada
    const weekData = getWeeklyReportData();
    if (weekData.length === 0) return [];

    // Crear un conjunto de fechas de la semana seleccionada
    const weekDates = new Set<string>();
    weekData.forEach(item => {
      if (!item.esSubtotal && !item.esTotal) {
        const parts = item.fecha.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const year = parseInt(parts[2]);

          // Crear fecha sin componente de tiempo
          const weekDate = new Date(year, month, day);
          const weekLocalDateKey = getLocalDateKey(weekDate);
          weekDates.add(weekLocalDateKey);
        }
      }
    });

    // Filtrar las entregas que corresponden a las fechas de la semana seleccionada
    return reportData.filter(item => {
      const itemDate = parseLocalDate(item.fecha);
      const itemLocalDateKey = getLocalDateKey(itemDate);
      return weekDates.has(itemLocalDateKey);
    });
  };

  const paginate = (items: any[], page: number, perPage: number) => {
    const startIndex = (page - 1) * perPage;
    return items.slice(startIndex, startIndex + perPage);
  };

  const totalPages = Math.ceil(reportData.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded ${
            currentPage === 1 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Anterior
        </button>

        <span className="px-3 py-1 bg-gray-100 rounded">
          Página {currentPage} de {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded ${
            currentPage === totalPages 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Siguiente
        </button>
      </div>
    );
  };


  // Interfaz UI PRINCIPAL
  if (loading) return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-14 w-14 border-4 border-t-blue-600 rounded-full" />
      </div>
  );
  if (error) return (
      <div className="text-center py-8">
        <span className="text-red-700 font-semibold text-lg">{error}</span>
      </div>
  );

  return (
      <div className="w-full sm:max-w-full md:max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-10 flex flex-col gap-6">
        {/* Encabezado principal */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-blue-900 mb-2 tracking-tight">
              Reportes de Entregas de Medicamentos
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-500">Consultas diarias, semanales y mensuales del sistema</p>
          </div>
          <button
            onClick={() => void generateReport(undefined, true)}
            disabled={isRefreshing}
            className={`px-4 py-2 rounded-lg font-semibold shadow-sm flex items-center gap-2 transition-all ${
              isRefreshing 
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Actualizando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar Reporte
              </>
            )}
          </button>
        </header>

        {/* Selector de tipo de reporte */}
        <SectionCard>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <h2 className="text-base sm:text-lg font-bold text-blue-800 mb-2 sm:mb-0">Tipo de Reporte</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {(['daily', 'monthly', 'specificDay'] as const).map((type: 'daily' | 'monthly' | 'specificDay') => (
                  <button
                      key={type}
                      onClick={() => setReportType(type)}
                      className={`
                  px-3 sm:px-5 py-1 sm:py-2 rounded-lg text-sm sm:text-base font-semibold
                  ${reportType === type
                          ? 'bg-blue-700 text-white shadow'
                          : 'bg-gray-100 text-blue-700 hover:bg-blue-100 transition'
                      }
                `}
                  >
                    {type === 'daily' && 'Diario'}
                    {type === 'monthly' && 'Mensual'}
                    {type === 'specificDay' && 'Día Específico'}
                  </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Selector de fecha */}
        {reportType === 'daily' && (
          <SectionCard>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <h2 className="text-base sm:text-lg font-bold text-blue-800 mb-2 sm:mb-0">Fecha Actual</h2>
              <div className="flex items-center gap-2 w-full max-w-sm">
                <span className="text-sm sm:text-base font-medium">
                  {new Date().toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Selector de día específico */}
        {reportType === 'specificDay' && (
          <SectionCard>
            <div className="flex flex-col gap-4">
              <h2 className="text-base sm:text-lg font-bold text-blue-800 mb-2">Seleccionar Día Específico</h2>

              {/* Selección de Día */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label htmlFor="day-picker" className="text-sm font-medium text-gray-700 w-32 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Seleccionar Día:
                </label>
                <div className="flex items-center gap-2 w-full max-w-sm">
                  <div className="relative w-full">
                    <input
                      type="date"
                      id="day-picker"
                      value={selectedDate}
                      onChange={e => {
                        setSelectedDate(e.target.value);
                      }}
                      className="form-input rounded-lg border border-gray-300 w-full text-sm sm:text-base pl-3 pr-10 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  {selectedDate && (
                    <button
                      onClick={() => {
                        setSelectedDate("");
                      }}
                      className="ml-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs sm:text-sm whitespace-nowrap font-medium transition-colors flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Fecha seleccionada */}
              {selectedDate && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-800">Información del reporte:</span>
                  </div>
                  <div className="mt-2 ml-7 space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Fecha seleccionada:</span> {parseLocalDate(selectedDate).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {reportType === 'weekly' && (
          <SectionCard>
            <div className="flex flex-col gap-4">
              <h2 className="text-base sm:text-lg font-bold text-blue-800 mb-2">Seleccionar Mes y Semana</h2>

              {/* Selección de Mes */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label htmlFor="month-picker" className="text-sm font-medium text-gray-700 w-32 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Seleccionar Mes:
                </label>
                <div className="flex items-center gap-2 w-full max-w-sm">
                  <div className="relative w-full">
                    <input
                      type="month"
                      id="month-picker"
                      value={selectedMonth}
                      onChange={e => {
                        setSelectedMonth(e.target.value);
                        // Al cambiar el mes, resetear la semana seleccionada
                        setSelectedWeek(0);

                        // Generar una fecha para el primer día del mes seleccionado
                        if (e.target.value) {
                          const [year, month] = e.target.value.split('-').map(Number);
                          const firstDayOfMonth = new Date(year, month - 1, 1);
                          setSelectedDate(getLocalDateKey(firstDayOfMonth));
                        }
                      }}
                      className="form-input rounded-lg border border-gray-300 w-full text-sm sm:text-base pl-3 pr-10 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  {selectedMonth && (
                    <button
                      onClick={() => {
                        setSelectedMonth("");
                        setSelectedWeek(0);
                        setSelectedDate("");
                      }}
                      className="ml-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs sm:text-sm whitespace-nowrap font-medium transition-colors flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Selección de Semana */}
              {selectedMonth && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label htmlFor="week-selector" className="text-sm font-medium text-gray-700 w-32 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Seleccionar Semana:
                  </label>
                  <div className="flex flex-col w-full max-w-sm gap-2">
                    <select
                      id="week-selector"
                      value={selectedWeek}
                      onChange={e => {
                        const weekNum = parseInt(e.target.value);
                        setSelectedWeek(weekNum);

                        // Calcular la fecha para el primer día de la semana seleccionada
                        if (selectedMonth) {
                          const [year, month] = selectedMonth.split('-').map(Number);
                          const firstDayOfMonth = new Date(year, month - 1, 1);

                          // Calcular el primer lunes del mes
                          const firstMonday = new Date(firstDayOfMonth);
                          const dayOfWeek = firstMonday.getDay();
                          const daysToAdd = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
                          firstMonday.setDate(firstMonday.getDate() + daysToAdd);

                          // Calcular la fecha del primer día de la semana seleccionada
                          const weekStartDate = new Date(firstMonday);
                          weekStartDate.setDate(firstMonday.getDate() + (weekNum * 7));

                          // Actualizar la fecha seleccionada
                          setSelectedDate(getLocalDateKey(weekStartDate));
                        }
                      }}
                      className="form-select rounded-lg border border-gray-300 w-full text-sm sm:text-base"
                    >
                      {selectedMonth && (() => {
                        // Calcular las semanas del mes seleccionado
                        const [year, month] = selectedMonth.split('-').map(Number);
                        const firstDayOfMonth = new Date(year, month - 1, 1);
                        const lastDayOfMonth = new Date(year, month, 0);

                        // Calcular el primer lunes del mes
                        const firstMonday = new Date(firstDayOfMonth);
                        const firstDayOfWeek = firstMonday.getDay();
                        // Si el primer día del mes no es lunes, avanzar hasta el primer lunes del mes
                        const daysToAdd = firstDayOfWeek === 0 ? 1 : (firstDayOfWeek === 1 ? 0 : 8 - firstDayOfWeek);
                        firstMonday.setDate(firstMonday.getDate() + daysToAdd);

                        // Calcular cuántas semanas hay en el mes
                        const totalDays = lastDayOfMonth.getDate();
                        const firstMondayDate = firstMonday.getDate();
                        const weeksInMonth = Math.ceil((totalDays + (firstDayOfMonth.getDate() - firstMondayDate)) / 7);

                        // Generar opciones para cada semana del mes
                        return Array.from({ length: weeksInMonth }).map((_, i) => {
                          // Calcular el inicio de la semana
                          const weekStart = new Date(firstMonday);
                          weekStart.setDate(firstMonday.getDate() + (i * 7));

                          // Calcular el fin de la semana
                          const weekEnd = new Date(weekStart);
                          weekEnd.setDate(weekStart.getDate() + 6);

                          // Verificar si la semana pertenece al mes seleccionado
                          const weekStartMonth = weekStart.getMonth() + 1;
                          const weekEndMonth = weekEnd.getMonth() + 1;
                          const selectedMonthNum = month;
                          const weekLabel = `Semana ${i + 1}: ${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`;

                          // Indicar si la semana está parcialmente en otro mes
                          const isPartialWeek = weekStartMonth !== selectedMonthNum || weekEndMonth !== selectedMonthNum;
                          const weekDescription = isPartialWeek
                            ? `${weekLabel} (parcialmente en este mes)`
                            : weekLabel;

                          return (
                            <option key={i} value={i} className={isPartialWeek ? "text-gray-500" : ""}>
                              {weekDescription}
                            </option>
                          );
                        });
                      })()}
                    </select>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (selectedWeek > 0) {
                            const newWeek = selectedWeek - 1;
                            setSelectedWeek(newWeek);

                            // Actualizar la fecha seleccionada
                            if (selectedMonth) {
                              const [year, month] = selectedMonth.split('-').map(Number);
                              const firstDayOfMonth = new Date(year, month - 1, 1);

                              // Calcular el primer lunes del mes
                              const firstMonday = new Date(firstDayOfMonth);
                              const firstDayOfWeek = firstMonday.getDay();
                              // Si el primer día del mes no es lunes, avanzar hasta el primer lunes del mes
                              const daysToAdd = firstDayOfWeek === 0 ? 1 : (firstDayOfWeek === 1 ? 0 : 8 - firstDayOfWeek);
                              firstMonday.setDate(firstMonday.getDate() + daysToAdd);

                              // Calcular la fecha del primer día de la semana seleccionada
                              const weekStartDate = new Date(firstMonday);
                              weekStartDate.setDate(firstMonday.getDate() + (newWeek * 7));

                              // Actualizar la fecha seleccionada
                              setSelectedDate(getLocalDateKey(weekStartDate));
                            }
                          }
                        }}
                        disabled={selectedWeek === 0}
                        className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium ${
                          selectedWeek === 0 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors'
                        }`}
                      >
                        ← Semana Anterior
                      </button>
                      <button
                        onClick={() => {
                          // Calcular el número máximo de semanas en el mes
                          const [year, month] = selectedMonth.split('-').map(Number);
                          const firstDayOfMonth = new Date(year, month - 1, 1);
                          const lastDayOfMonth = new Date(year, month, 0);

                          // Calcular el primer lunes del mes
                          const firstMonday = new Date(firstDayOfMonth);
                          const firstDayOfWeek = firstMonday.getDay();
                          // Si el primer día del mes no es lunes, avanzar hasta el primer lunes del mes
                          const daysToAdd = firstDayOfWeek === 0 ? 1 : (firstDayOfWeek === 1 ? 0 : 8 - firstDayOfWeek);
                          firstMonday.setDate(firstMonday.getDate() + daysToAdd);

                          // Calcular cuántas semanas hay en el mes
                          const totalDays = lastDayOfMonth.getDate();
                          const firstMondayDate = firstMonday.getDate();
                          const weeksInMonth = Math.ceil((totalDays + (firstDayOfMonth.getDate() - firstMondayDate)) / 7);
                          const maxWeek = weeksInMonth - 1;
                          if (selectedWeek < maxWeek) {
                            const newWeek = selectedWeek + 1;
                            setSelectedWeek(newWeek);

                            // Actualizar la fecha seleccionada
                            if (selectedMonth) {
                              // Calcular la fecha del primer día de la semana seleccionada
                              const weekStartDate = new Date(firstMonday);
                              weekStartDate.setDate(firstMonday.getDate() + (newWeek * 7));

                              // Actualizar la fecha seleccionada
                              setSelectedDate(getLocalDateKey(weekStartDate));
                            }
                          }
                        }}
                        disabled={(() => {
                          const currentSelectedWeek = selectedWeek;
                          if (!selectedMonth) return true;

                          // Calcular el número máximo de semanas en el mes
                          const [year, month] = selectedMonth.split('-').map(Number);
                          const firstDayOfMonth = new Date(year, month - 1, 1);
                          const lastDayOfMonth = new Date(year, month, 0);

                          // Calcular el primer lunes del mes o anterior si el mes comienza en otro día
                          const firstMonday = new Date(firstDayOfMonth);
                          const firstDayOfWeek = firstMonday.getDay();
                          const daysToAdd = firstDayOfWeek === 0 ? 1 : (firstDayOfWeek === 1 ? 0 : 8 - firstDayOfWeek);
                          firstMonday.setDate(firstMonday.getDate() + daysToAdd);

                          // Si el primer lunes es después del primer día del mes, retroceder una semana
                          if (firstMonday > firstDayOfMonth && daysToAdd > 0) {
                            firstMonday.setDate(firstMonday.getDate() - 7);
                          }

                          // Calcular cuántas semanas hay en el mes
                          const totalDays = lastDayOfMonth.getDate();
                          const firstMondayDate = firstMonday.getDate();
                          const weeksInMonth = Math.ceil((totalDays + (firstDayOfMonth.getDate() - firstMondayDate)) / 7);
                          const maxWeek = weeksInMonth - 1;

                          return currentSelectedWeek >= maxWeek;
                        })()}
                        className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium ${
                          (() => {
                            const currentSelectedWeek = selectedWeek;
                            if (!selectedMonth) return 'bg-gray-100 text-gray-400 cursor-not-allowed';

                            // Calcular el número máximo de semanas en el mes
                            const [year, month] = selectedMonth.split('-').map(Number);
                            const firstDayOfMonth = new Date(year, month - 1, 1);
                            const lastDayOfMonth = new Date(year, month, 0);

                            // Calcular el primer lunes del mes o anterior si el mes comienza en otro día
                            const firstMonday = new Date(firstDayOfMonth);
                            const firstDayOfWeek = firstMonday.getDay();
                            const daysToAdd = firstDayOfWeek === 0 ? 1 : (firstDayOfWeek === 1 ? 0 : 8 - firstDayOfWeek);
                            firstMonday.setDate(firstMonday.getDate() + daysToAdd);

                            // Si el primer lunes es después del primer día del mes, retroceder una semana
                            if (firstMonday > firstDayOfMonth && daysToAdd > 0) {
                              firstMonday.setDate(firstMonday.getDate() - 7);
                            }

                            // Calcular cuántas semanas hay en el mes
                            const totalDays = lastDayOfMonth.getDate();
                            const firstMondayDate = firstMonday.getDate();
                            const weeksInMonth = Math.ceil((totalDays + (firstDayOfMonth.getDate() - firstMondayDate)) / 7);
                            const maxWeek = weeksInMonth - 1;

                            return currentSelectedWeek >= maxWeek 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors';
                          })()
                        }`}
                      >
                        Semana Siguiente →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Fecha seleccionada */}
              {selectedDate && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-800">Información del reporte:</span>
                  </div>
                  <div className="mt-2 ml-7 space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Fecha seleccionada:</span> {parseLocalDate(selectedDate).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    {selectedMonth && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Mes:</span> {(() => {
                          const [year, month] = selectedMonth.split('-').map(Number);
                          const date = new Date(year, month - 1, 1);
                          return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                        })()}
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Semana:</span> {selectedWeek + 1} del mes
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Reporte Diario */}
        {reportType === 'daily' && (
            <ReportSection
              title="Reporte de Entregas Diarias"
              onExportPDF={() => handleExportPDF('daily', 'Reporte de Entregas Diarias')}
            >
              <ReportTable
                data={paginate(reportData, currentPage, itemsPerPage)}
                columns={[
                  { key: 'clave', header: 'Clave' },
                  ...(user?.role === 'ADMIN' ? [{ key: 'personal', header: 'Encargado' }] : []),
                  { key: 'medicamento', header: 'Medicamento' },
                  { key: 'cantidad', header: 'Cantidad' },
                  { key: 'general', header: 'General' },
                  { key: 'dental', header: 'Dental' },
                  { key: 'vales', header: 'Vales' }
                ]}
                emptyMessage="No hay datos disponibles para el reporte diario."
                renderRow={(item, dateIndex) => (
                  item.medicamentos.map((med: MedicamentoItem, medIndex: number) => (
                    <tr key={`${dateIndex}-${medIndex}`} className={dateIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {medIndex === 0 && (
                        <td rowSpan={item.medicamentos ? item.medicamentos.length : 1} className="px-2 sm:px-3 md:px-5 py-1 sm:py-2 font-bold">{item.clave}</td>
                      )}
                      {user?.role === 'ADMIN' && medIndex === 0 && (
                        <td rowSpan={item.medicamentos ? item.medicamentos.length : 1} className="px-2 sm:px-3 md:px-5 py-1 sm:py-2">{item.personal?.nombre || 'N/A'}</td>
                      )}
                      <td className="px-2 sm:px-3 md:px-5 py-1 sm:py-2">{med.nombre}</td>
                      <td className="px-2 sm:px-3 md:px-5 py-1 sm:py-2">{med.cantidad}</td>
                      {medIndex === 0 && (
                        <>
                          <td rowSpan={item.medicamentos.length} className="px-2 sm:px-3 md:px-5 py-1 sm:py-2">{item.totalGeneral}</td>
                          <td rowSpan={item.medicamentos.length} className="px-2 sm:px-3 md:px-5 py-1 sm:py-2">{item.totalDental}</td>
                          <td rowSpan={item.medicamentos.length} className="px-2 sm:px-3 md:px-5 py-1 sm:py-2">{item.totalVales}</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              />
              <Pagination />
            </ReportSection>
        )}

        {/* Reporte de Día Específico */}
        {reportType === 'specificDay' && (
            <ReportSection
              title="Reporte de Entregas por Día Específico"
              onExportPDF={() => handleExportPDF('specificDay', 'Reporte de Entregas por Día Específico')}
            >
              <ReportTable
                data={paginate(reportData, currentPage, itemsPerPage)}
                columns={[
                  { key: 'clave', header: 'Clave' },
                  ...(user?.role === 'ADMIN' ? [{ key: 'personal', header: 'Encargado' }] : []),
                  { key: 'medicamento', header: 'Medicamento' },
                  { key: 'cantidad', header: 'Cantidad' },
                  { key: 'general', header: 'General' },
                  { key: 'dental', header: 'Dental' },
                  { key: 'vales', header: 'Vales' }
                ]}
                emptyMessage="No hay datos disponibles para el día seleccionado."
                renderRow={(item, dateIndex) => (
                  item.medicamentos.map((med: MedicamentoItem, medIndex: number) => (
                    <tr key={`${dateIndex}-${medIndex}`} className={dateIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {medIndex === 0 && (
                        <td rowSpan={item.medicamentos ? item.medicamentos.length : 1} className="px-2 sm:px-3 md:px-5 py-1 sm:py-2 font-bold">{item.clave}</td>
                      )}
                      {user?.role === 'ADMIN' && medIndex === 0 && (
                        <td rowSpan={item.medicamentos ? item.medicamentos.length : 1} className="px-2 sm:px-3 md:px-5 py-1 sm:py-2">{item.personal?.nombre || 'N/A'}</td>
                      )}
                      <td className="px-2 sm:px-3 md:px-5 py-1 sm:py-2">{med.nombre}</td>
                      <td className="px-2 sm:px-3 md:px-5 py-1 sm:py-2">{med.cantidad}</td>
                      {medIndex === 0 && (
                        <>
                          <td rowSpan={item.medicamentos.length} className="px-2 sm:px-3 md:px-5 py-1 sm:py-2">{item.totalGeneral}</td>
                          <td rowSpan={item.medicamentos.length} className="px-2 sm:px-3 md:px-5 py-1 sm:py-2">{item.totalDental}</td>
                          <td rowSpan={item.medicamentos.length} className="px-2 sm:px-3 md:px-5 py-1 sm:py-2">{item.totalVales}</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              />
              <Pagination />
            </ReportSection>
        )}

        {/* Reporte Semanal */}
        {reportType === 'weekly' && (
            <ReportSection
              title="Reporte de Entregas Semanales"
              onExportPDF={() => handleExportPDF('weekly', 'Reporte de Entregas Semanales')}
            >
              <div className="mb-4">
                <h3 className="text-md font-semibold text-blue-800 mb-2">Resumen Semanal</h3>
                <WeeklyTable data={getWeeklyReportData()} />
              </div>

              <h3 className="text-md font-semibold text-blue-800 mb-2 mt-6">Detalle de Entregas</h3>
              <ReportTable
                data={paginate(getWeeklyDeliveries(), currentPage, itemsPerPage)}
                columns={[
                  { key: 'fecha', header: 'Fecha' },
                  { key: 'clave', header: 'Clave' },
                  ...(user?.role === 'ADMIN' ? [{ key: 'personal', header: 'Encargado' }] : []),
                  { key: 'medicamento', header: 'Medicamento' },
                  { key: 'cantidad', header: 'Cantidad' },
                  { key: 'general', header: 'General' },
                  { key: 'dental', header: 'Dental' },
                  { key: 'vales', header: 'Vales' }
                ]}
                emptyMessage="No hay datos disponibles para el reporte semanal."
                renderRow={(item, dateIndex) => {
                  const currentSelectedWeek = selectedWeek;

                  // Obtener la fecha local
                  const itemDate = parseLocalDate(item.fecha);
                  // Crear una clave de fecha local para comparación
                  const itemLocalDateKey = getLocalDateKey(itemDate);

                  // Inicialmente usar el formato estándar
                  let displayDate = formatDate(item.fecha);

                  if (selectedDate) {
                    // Generar el reporte mensual completo
                    const monthlyReportData = generateMonthlyReport(reportData, selectedDate);

                    // Buscar los subtotales para identificar las semanas
                    const subtotalIndices: number[] = [];
                    monthlyReportData.forEach((item, index) => {
                      if (item.esSubtotal) {
                        subtotalIndices.push(index);
                      }
                    });

                    // Si no hay suficientes subtotales, no hacer nada
                    if (subtotalIndices.length <= currentSelectedWeek) return;

                    // Determinar el inicio y fin de la semana seleccionada
                    const weekStartIndex = currentSelectedWeek === 0 ? 0 : subtotalIndices[currentSelectedWeek - 1] + 1;
                    const weekEndIndex = subtotalIndices[currentSelectedWeek];
                    const weekData = monthlyReportData.slice(weekStartIndex, weekEndIndex);

                    // Buscar la fecha correspondiente en el reporte semanal
                    for (const weekItem of weekData) {
                      if (!weekItem.esTotal && !weekItem.esSubtotal) {
                        const parts = weekItem.fecha.split('/');
                        if (parts.length === 3) {
                          const day = parseInt(parts[0]);
                          const month = parseInt(parts[1]) - 1;
                          const year = parseInt(parts[2]);

                          // Crear fecha sin componente de tiempo
                          const weekDate = new Date(year, month, day);
                          const weekLocalDateKey = getLocalDateKey(weekDate);

                          if (itemLocalDateKey === weekLocalDateKey) {
                            displayDate = weekItem.fecha;
                            break;
                          }
                        }
                      }
                    }
                  }

                  return item.medicamentos.map((med: MedicamentoItem, medIndex: number) => (
                    <tr key={`${dateIndex}-${medIndex}`} className={dateIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {medIndex === 0 && (
                        <td rowSpan={item.medicamentos.length} className="px-5 py-2">{displayDate}</td>
                      )}
                      {medIndex === 0 && (
                        <td rowSpan={item.medicamentos.length} className="px-5 py-2 font-bold">{item.clave}</td>
                      )}
                      {user?.role === 'ADMIN' && medIndex === 0 && (
                        <td rowSpan={item.medicamentos.length} className="px-5 py-2">{item.personal?.nombre || 'N/A'}</td>
                      )}
                      <td className="px-5 py-2">{med.nombre}</td>
                      <td className="px-5 py-2">{med.cantidad}</td>
                      {medIndex === 0 && (
                        <>
                          <td rowSpan={item.medicamentos.length} className="px-5 py-2">{item.totalGeneral}</td>
                          <td rowSpan={item.medicamentos.length} className="px-5 py-2">{item.totalDental}</td>
                          <td rowSpan={item.medicamentos.length} className="px-5 py-2">{item.totalVales}</td>
                        </>
                      )}
                    </tr>
                  ));
                }}
              />
              <Pagination />
            </ReportSection>
        )}

        {/* Selector de mes para reportes mensuales */}
        {reportType === 'monthly' && (
          <SectionCard>
            <div className="flex flex-col gap-4">
              <h2 className="text-base sm:text-lg font-bold text-blue-800 mb-2">Seleccionar Mes</h2>

              {/* Selección de Mes */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label htmlFor="month-picker-monthly" className="text-sm font-medium text-gray-700 w-32 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Seleccionar Mes:
                </label>
                <div className="flex items-center gap-2 w-full max-w-sm">
                  <div className="relative w-full">
                    <input
                      type="month"
                      id="month-picker-monthly"
                      value={selectedMonth}
                      onChange={e => {
                        setSelectedMonth(e.target.value);

                        // Generar una fecha para el primer día del mes seleccionado
                        if (e.target.value) {
                          const [year, month] = e.target.value.split('-').map(Number);
                          const firstDayOfMonth = new Date(year, month - 1, 1);
                          setSelectedDate(getLocalDateKey(firstDayOfMonth));
                        }
                      }}
                      className="form-input rounded-lg border border-gray-300 w-full text-sm sm:text-base pl-3 pr-10 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  {selectedMonth && (
                    <button
                      onClick={() => {
                        setSelectedMonth("");
                        setSelectedDate("");
                      }}
                      className="ml-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs sm:text-sm whitespace-nowrap font-medium transition-colors flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Mes seleccionado */}
              {selectedMonth && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-800">Información del reporte:</span>
                  </div>
                  <div className="mt-2 ml-7 space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Mes seleccionado:</span> {(() => {
                        const [year, month] = selectedMonth.split('-').map(Number);
                        const date = new Date(year, month - 1, 1);
                        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                      })()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Reporte Mensual */}
        {reportType === 'monthly' && (
            <ReportSection
              title="INFORME MENSUAL DE MEDICAMENTO DEL ÁREA DE FARMACIA"
              onExportPDF={() => handleExportPDF('monthly', 'INFORME MENSUAL DE MEDICAMENTO DEL ÁREA DE FARMACIA')}
            >
              <MonthlyTable data={generateMonthlyReport(reportData, selectedDate)} />
            </ReportSection>
        )}

        {/* Footer con total entregas */}
        <footer className="flex justify-center sm:justify-end mt-6 sm:mt-10 pt-4 sm:pt-6 border-t border-gray-200">
          <span className="text-lg sm:text-xl font-extrabold text-blue-900">
            TOTAL: {reportData.reduce((sum: number, item: ReportItem) => sum + item.totalEntregas, 0)} entregas
          </span>
        </footer>
      </div>
  );
};

export default ReportesCombinados;
