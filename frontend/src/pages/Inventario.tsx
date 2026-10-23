import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '@/auth/AuthContext'; // Importar useAuth

type Medicamento = {
  id: number;
  clave: string;
  nombre: string;
  cantidadActual: number;
  fechaCaducidad: string;
};

type MedicamentoFormData = {
  clave?: string;
  nombre: string;
  cantidadActual: number;
  fechaCaducidad: string;
};

const Inventario = () => {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMedicamento, setCurrentMedicamento] = useState<Medicamento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth(); // Obtener el usuario del contexto

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<MedicamentoFormData>();

  const fetchMedicamentos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<Medicamento[]>('/api/medicamentos');
      setMedicamentos(data);
      setRetryCount(0);
    } catch (error) {
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        toast.warning('Reintentando cargar el inventario...');
        setTimeout(() => fetchMedicamentos(), 1500);
      } else {
        toast.error('No se pudo cargar el inventario');
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  useEffect(() => {
    void fetchMedicamentos();
  }, [fetchMedicamentos]);

  const onSubmit = async (form: MedicamentoFormData) => {
    try {
      const formData = {
        ...form,
        cantidadActual: Number(form.cantidadActual),
        clave: isEditing && currentMedicamento ? currentMedicamento.clave : `MED-${Date.now()}`
      };

      if (isEditing && currentMedicamento) {
        await axios.put(`/api/medicamentos/${currentMedicamento.id}`, formData);
        toast.success('Medicamento actualizado');
      } else {
        await axios.post('/api/medicamentos', formData);
        toast.success('Medicamento agregado');
      }
      resetForm();
      void fetchMedicamentos();
    } catch {
      toast.error('Error al guardar');
    }
  };

  const resetForm = () => {
    reset({
      nombre: '',
      cantidadActual: 0,
      fechaCaducidad: ''
    });
    setCurrentMedicamento(null);
    setIsEditing(false);
  };

  const handleEdit = (m: Medicamento) => {
    setIsEditing(true);
    setCurrentMedicamento(m);
    reset({
      nombre: m.nombre,
      cantidadActual: m.cantidadActual,
      fechaCaducidad: m.fechaCaducidad.split('T')[0]
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Quieres eliminar este medicamento?')) return;
    try {
      await axios.delete(`/api/medicamentos/${id}`);
      toast.success('Eliminado');
      void fetchMedicamentos();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const isAboutToExpire = (d: string) => {
    const days = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days < 30;
  };
  const hasExpired = (d: string) => new Date(d) < new Date();

  const filtered = medicamentos.filter(
      (m) =>
          m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.clave.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (hasExpired(a.fechaCaducidad) && !hasExpired(b.fechaCaducidad)) return -1;
    if (!hasExpired(a.fechaCaducidad) && hasExpired(b.fechaCaducidad)) return 1;
    if (isAboutToExpire(a.fechaCaducidad) && !isAboutToExpire(b.fechaCaducidad)) return -1;
    if (!isAboutToExpire(a.fechaCaducidad) && isAboutToExpire(b.fechaCaducidad)) return 1;
    const aLowStock = a.cantidadActual < 10;
    const bLowStock = b.cantidadActual < 10;
    if (aLowStock && !bLowStock) return -1;
    if (!aLowStock && bLowStock) return 1;
    return a.nombre.localeCompare(b.nombre);
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // --- INICIO DE LA SECCIÓN CORREGIDA ---

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
    doc.text("Reporte de Inventario de Medicamentos", 14, 30);

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
    const dateString = currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const capitalizedDateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);

    // Mostrar fecha completa
    doc.text(`Fecha: ${capitalizedDateString}`, 14, 50);

    const tableColumn = ["Clave", "Nombre", "Cantidad Actual", "Fecha de Caducidad"];
    const tableRows: (string | number)[][] = [];

    sortedFiltered.forEach(medicamento => {
      const fechaCaducidad = new Date(medicamento.fechaCaducidad).toLocaleDateString('es-MX', {
        timeZone: 'UTC'
      });
      const medicamentoData = [
        medicamento.clave,
        medicamento.nombre,
        medicamento.cantidadActual,
        fechaCaducidad
      ];
      tableRows.push(medicamentoData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55, // Ajustar la posición de inicio de la tabla
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

    // --- FIN DE LA SECCIÓN CORREGIDA ---

    const date = new Date().toISOString().split('T')[0];
    doc.save(`reporte_inventario_${date}.pdf`);
  };


  if (loading && medicamentos.length === 0) {
    return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-4 border-t-primary-600 rounded-full border-gray-300" />
        </div>
    );
  }

  return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        <header className="mb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-primary-900 mb-1">
                Gestión de Inventario
              </h1>
              <p className="text-lg text-gray-500">
                Controla el inventario de medicamentos de la farmacia
              </p>
            </div>
            <button
                onClick={handleExportPDF}
                className="mt-3 md:mt-0 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
            >
              Exportar a PDF
            </button>
          </div>
        </header>

        {/* Formulario */}
        <section className="bg-white rounded-xl shadow-lg px-8 py-7">
          <h2 className="text-2xl font-bold text-primary-800 mb-4">
            {isEditing ? 'Editar' : 'Agregar'} Medicamento
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 text-gray-700 font-semibold">Nombre</label>
                <input
                    {...register('nombre', { required: true })}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${
                        errors.nombre ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ejemplo: Paracetamol"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-700 font-semibold">Cantidad Actual</label>
                <input
                    type="number"
                    min={0}
                    {...register('cantidadActual', { required: true, min: 0 })}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${
                        errors.cantidadActual ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-700 font-semibold">Fecha de Caducidad</label>
                <input
                    type="date"
                    {...register('fechaCaducidad', { required: true })}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${
                        errors.fechaCaducidad ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              {isEditing && (
                  <button
                      type="button"
                      onClick={resetForm}
                      className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancelar
                  </button>
              )}
              <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold shadow-sm transition-all hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isEditing ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </section>

        {/* Buscador */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <input
              type="text"
              placeholder="Buscar por nombre o clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/3 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 border-gray-300"
          />
          <div className="flex flex-wrap gap-4 items-center bg-white p-3 rounded-lg shadow-sm">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-md border border-red-200">
              <span className="inline-block w-4 h-4 bg-red-500 rounded-full shadow-sm" />
              <span className="font-medium text-red-700">Caducado</span>
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-md border border-yellow-200">
              <span className="inline-block w-4 h-4 bg-yellow-400 rounded-full shadow-sm" />
              <span className="font-medium text-yellow-700">Próx. caducar</span>
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-md border border-orange-200">
              <span className="inline-block w-4 h-4 bg-orange-500 rounded-full shadow-sm" />
              <span className="font-medium text-orange-700">Stock bajo</span>
            </span>
          </div>
        </section>

        {/* Lista de medicamentos */}
        {sortedFiltered.length === 0 ? (
            <div className="text-center text-gray-500 py-12 text-lg">
              No hay medicamentos registrados.
            </div>
        ) : (
            <section className="grid gap-6">
              {sortedFiltered.map((m) => (
                  <div
                      key={m.id}
                      className={`
                rounded-xl px-7 py-6 shadow-md flex flex-col md:flex-row md:items-center md:justify-between border-l-[12px] transition-all
                ${hasExpired(m.fechaCaducidad)
                          ? 'border-red-500 bg-red-50'
                          : isAboutToExpire(m.fechaCaducidad)
                              ? 'border-yellow-400 bg-yellow-50'
                              : m.cantidadActual < 10
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-transparent bg-white'
                      }
              `}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-mono text-gray-500">{m.clave}</p>
                        {hasExpired(m.fechaCaducidad) && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded-full border border-red-200">
                            Caducado
                          </span>
                        )}
                        {isAboutToExpire(m.fechaCaducidad) && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200">
                            Próx. caducar
                          </span>
                        )}
                        {m.cantidadActual < 10 && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-bold rounded-full border border-orange-200">
                            Stock bajo
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-primary-700">{m.nombre}</h3>
                      <p className="mt-2 flex items-center">
                        <span className="font-semibold mr-2">Cantidad:</span>
                        <span className={`${m.cantidadActual < 10 ? 'text-orange-600 font-bold px-2 py-0.5 bg-orange-100 rounded-md' : ''}`}>
                          {m.cantidadActual}
                        </span>
                      </p>
                      <p className="mt-1 flex items-center">
                        <span className="font-semibold mr-2">Caduca:</span>
                        <span
                            className={
                              hasExpired(m.fechaCaducidad)
                                  ? 'text-red-600 font-bold px-2 py-0.5 bg-red-100 rounded-md'
                                  : isAboutToExpire(m.fechaCaducidad)
                                      ? 'text-yellow-600 font-bold px-2 py-0.5 bg-yellow-100 rounded-md'
                                      : ''
                            }
                        >
                          {new Date(m.fechaCaducidad).toLocaleDateString('es-MX', {
                            timeZone: 'UTC'
                          })}
                        </span>
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex-shrink-0 flex gap-3">
                      <button
                          onClick={() => handleEdit(m)}
                          className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Editar
                      </button>
                      <button
                          onClick={() => handleDelete(m.id)}
                          className="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
              ))}
            </section>
        )}
      </div>
  );
};

export default Inventario;