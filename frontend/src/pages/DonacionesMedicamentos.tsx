import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

type Medicamento = {
  id: number;
  clave: string;
  nombre: string;
  cantidadActual: number;
  fechaCaducidad: string;
};

type DonacionFormData = {
  clave: string;
  nombre: string;
  cantidad: number;
  fechaCaducidad: string;
};

type Donacion = {
  id: string;
  nombre: string;
  cantidad: number;
  fecha: Date;
};

const DonacionesMedicamentos = () => {
  console.log('Inicializando componente DonacionesMedicamentos');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donacionesRecientes, setDonacionesRecientes] = useState<
      { nombre: string; cantidad: number; fecha: Date }[]
  >([]);
  const [todasDonaciones, setTodasDonaciones] = useState<Donacion[]>([]);
  const [searchDonacionesTerm, setSearchDonacionesTerm] = useState('');
  const [generatedClave, setGeneratedClave] = useState<string>('');
  const [loadingDonaciones, setLoadingDonaciones] = useState(false);
  const [errorDonaciones, setErrorDonaciones] = useState<string | null>(null);

  console.log('Estado inicial:', {
    medicamentos: 'array vacío',
    loading: true,
    error: null,
    donacionesRecientes: 'array vacío',
    todasDonaciones: 'array vacío',
    searchDonacionesTerm: '',
    generatedClave: '',
    loadingDonaciones: false,
    errorDonaciones: null
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<DonacionFormData>();

  // Generar una clave única para el medicamento
  const generateClave = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const newClave = `MED-${timestamp}-${random}`;
    setGeneratedClave(newClave);
    setValue('clave', newClave);
    return newClave;
  };

  // Cargar inventario desde la API
  const fetchMedicamentos = async () => {
    console.log('Iniciando fetchMedicamentos()');
    try {
      setLoading(true);
      setError(null);
      console.log('Haciendo petición GET a /api/medicamentos');
      const response = await axios.get<Medicamento[]>('/api/medicamentos', {
      });
      console.log('Respuesta de /api/medicamentos:', response.data);
      console.log('Cantidad de medicamentos recibidos:', response.data.length);
      setMedicamentos(response.data);
    } catch (_err) {
      console.error('Error en fetchMedicamentos():', _err);
      setError('Error al cargar medicamentos');
      toast.error('No se pudo cargar el inventario');
    } finally {
      setLoading(false);
      console.log('Finalizando fetchMedicamentos(), cargando =', false);
    }
  };

  // Cargar donaciones desde la API
  const fetchDonaciones = useCallback(async (showMessages = false) => {
    console.log('Iniciando fetchDonaciones()', { showMessages });
    setLoadingDonaciones(true);
    setErrorDonaciones(null); // Limpia errores anteriores
    try {
      console.log('Haciendo petición GET a /api/donaciones');
      const response = await axios.get<any[]>('/api/donaciones'); // Recibimos como any para transformar
      console.log('Respuesta de /api/donaciones:', response.data);
      console.log('Cantidad de donaciones recibidas:', response.data.length);

      const donacionesTransformadas = response.data.map(d => ({
        ...d,
        fecha: new Date(d.fecha) // Convertimos el string de fecha a un objeto Date
      }));

      console.log('Donaciones transformadas:', donacionesTransformadas);
      console.log('Cantidad de donaciones transformadas:', donacionesTransformadas.length);

      setTodasDonaciones(donacionesTransformadas);
      console.log('Estado todasDonaciones actualizado con', donacionesTransformadas.length, 'donaciones');

      if (showMessages) {
        toast.success('Historial de donaciones actualizado.');
      }
    } catch (error) {
      console.error('Error en fetchDonaciones():', error);
      // Establece un mensaje de error para mostrarlo en la UI
      setErrorDonaciones('No se pudo cargar el historial. Intente de nuevo.');
      if (showMessages) {
        toast.error('Error al cargar el historial de donaciones.');
      }
    } finally {
      setLoadingDonaciones(false);
      console.log('Finalizando fetchDonaciones(), loadingDonaciones =', false);
    }
  }, []);

  // Separar la carga de medicamentos y donaciones para evitar condiciones de carrera
  useEffect(() => {
    console.log('useEffect para cargar medicamentos - INICIANDO');
    // Efecto para cargar medicamentos y generar clave
    const loadInitialData = async () => {
      try {
        console.log('Llamando a fetchMedicamentos() desde useEffect');
        await fetchMedicamentos();
        console.log('fetchMedicamentos() completado, generando clave');
        generateClave(); // Genera una clave única cuando carga el componente
      } catch (error) {
        console.error('Error en useEffect al cargar medicamentos:', error);
        // Asegurar que la clave se genere incluso si falla la carga de medicamentos
        console.log('Generando clave a pesar del error');
        generateClave();
      }
    };

    void loadInitialData();
    console.log('useEffect para cargar medicamentos - FINALIZADO');
  }, []);

  // useEffect para cargar donaciones
  useEffect(() => {
    console.log('useEffect para cargar donaciones - INICIANDO');
    // Cargar donaciones en un efecto separado para evitar condiciones de carrera
    // y asegurar que se ejecuta incluso si falla la carga de medicamentos
    console.log('Llamando a fetchDonaciones() desde useEffect');
    void fetchDonaciones();
    console.log('useEffect para cargar donaciones - FINALIZADO');
  }, [fetchDonaciones]);

  // Registra o actualiza una donación
  const onSubmit = async (form: DonacionFormData) => {
    console.log('Iniciando onSubmit con datos:', form);
    try {
      const fechaDonacion = new Date().toISOString();
      console.log('Fecha de donación generada:', fechaDonacion);

      // Verificar si ya existe el medicamento en inventario
      console.log('Buscando medicamento existente con clave:', form.clave);
      const existingMedicamento = medicamentos.find((m) => m.clave === form.clave);
      console.log('¿Medicamento encontrado?', existingMedicamento ? 'Sí' : 'No');

      if (existingMedicamento) {
        // Si existe, suma la cantidad donada
        console.log('Actualizando medicamento existente ID:', existingMedicamento.id);
        const nuevaCantidad = Number(existingMedicamento.cantidadActual) + Number(form.cantidad);
        console.log('Nueva cantidad total:', nuevaCantidad);

        await axios.put(
            `/api/medicamentos/${existingMedicamento.id}`,
            {
              cantidadActual: nuevaCantidad,
            }
        );
        console.log('Medicamento actualizado correctamente');
        toast.success('Donación registrada y agregada al inventario');
      } else {
        // Si no existe, crea uno nuevo
        console.log('Creando nuevo medicamento con clave:', form.clave);
        const nuevoMedicamento = {
          clave: form.clave,
          nombre: form.nombre,
          cantidadActual: Number(form.cantidad),
          fechaCaducidad: form.fechaCaducidad,
        };
        console.log('Datos del nuevo medicamento:', nuevoMedicamento);

        await axios.post('/api/medicamentos', nuevoMedicamento);
        console.log('Nuevo medicamento creado correctamente');
        toast.success('Nuevo medicamento registrado en el inventario');
      }

      // Crear nueva donación en la API
      console.log('Registrando nueva donación en el historial');
      const nuevaDonacion = {
        nombre: form.nombre,
        cantidad: Number(form.cantidad),
        fecha: fechaDonacion,
      };
      console.log('Datos de la nueva donación:', nuevaDonacion);

      await axios.post('/api/donaciones', nuevaDonacion);
      console.log('Donación registrada correctamente en el historial');
      toast.success('Donación registrada en el historial');

      // Agregar a la lista de donaciones recientes (máx. 10) para la UI
      console.log('Actualizando lista de donaciones recientes en la UI');
      setDonacionesRecientes((prev) => {
        const nuevaLista = [
          {
            nombre: form.nombre,
            cantidad: form.cantidad,
            fecha: new Date(fechaDonacion), // Convertimos el string de fecha a un objeto Date
          },
          ...prev.slice(0, 9),
        ];
        console.log('Nueva lista de donaciones recientes:', nuevaLista);
        return nuevaLista;
      });

      // Recargar el historial de donaciones desde la API
      console.log('Recargando historial de donaciones');
      await fetchDonaciones();

      // Limpiar formulario, generar nueva clave y recargar inventario
      console.log('Limpiando formulario y generando nueva clave');
      reset();
      generateClave(); // Genera una nueva clave cuando el formulario se reinicia
      console.log('Recargando inventario de medicamentos');
      await fetchMedicamentos();
      console.log('Proceso de donación completado exitosamente');
    } catch (err) {
      console.error('Error al registrar la donación:', err);
      toast.error('Error al registrar la donación');
    }
  };


  // Si está cargando y aún no hay datos, muestra spinner
  console.log('Evaluando condición de renderizado inicial:', {
    loading,
    medicamentosLength: medicamentos.length,
    loadingDonaciones,
    todasDonacionesLength: todasDonaciones.length
  });

  if (loading && medicamentos.length === 0) {
    console.log('Renderizando spinner de carga inicial');
    return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-4 border-t-primary-600 rounded-full border-gray-300" />
        </div>
    );
  }

  console.log('Pasando a renderizado principal del componente');

  // Filtrar donaciones según el término de búsqueda
  console.log('INICIO FILTRADO DE DONACIONES');
  console.log('Término de búsqueda:', searchDonacionesTerm);
  console.log('Total de donaciones antes de filtrar:', todasDonaciones.length);

  if (todasDonaciones.length === 0) {
    console.log('ALERTA: No hay donaciones para filtrar. Estado todasDonaciones está vacío.');
  } else {
    console.log('Primera donación en todasDonaciones:', todasDonaciones[0]);
    console.log('Última donación en todasDonaciones:', todasDonaciones[todasDonaciones.length - 1]);
  }

  // Verificar si todasDonaciones tiene la estructura esperada
  const estructuraCorrecta = todasDonaciones.every(d =>
    typeof d === 'object' &&
    d !== null &&
    'id' in d &&
    'nombre' in d &&
    'cantidad' in d &&
    'fecha' in d
  );

  console.log('¿Donaciones tiene la estructura correcta?', estructuraCorrecta);

  if (!estructuraCorrecta && todasDonaciones.length > 0) {
    console.log('ALERTA: Estructura incorrecta en Donaciones. Ejemplo:', todasDonaciones[0]);
  }

  const filteredDonaciones = todasDonaciones.filter(
    (donacion) => {
      if (!donacion) {
        console.log('ALERTA: Donación inválida encontrada durante filtrado:', donacion);
        return false;
      }
      return donacion.nombre.toLowerCase().includes(searchDonacionesTerm.toLowerCase());
    }
  );

  console.log('Donaciones filtradas:', filteredDonaciones.length);
  console.log('FIN FILTRADO DE DONACIONES');

  return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">
        <header className="mb-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary-900 mb-2">Donaciones de Medicamentos</h1>
          <p className="text-base sm:text-lg text-gray-500">Registra, consulta y controla el inventario de donaciones</p>
        </header>

        {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow">
              {error}
            </div>
        )}

        {/* Formulario de donación */}
        <section className="bg-white rounded-xl shadow-lg px-4 sm:px-8 py-5 sm:py-7">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-800 mb-3 sm:mb-4">Registrar Nueva Donación</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* El campo Clave está oculto en la UI, pero sigue registrado en el formulario */}
              <input
                  type="hidden"
                  {...register('clave', { required: true })}
                  value={generatedClave}
              />
              <div>
                <label className="block mb-1 text-sm sm:text-base text-gray-700 font-semibold">Nombre</label>
                <input
                    {...register('nombre', { required: true })}
                    className={`w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Ejemplo: Paracetamol"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm sm:text-base text-gray-700 font-semibold">Cantidad Donada</label>
                <input
                    type="number"
                    min={1}
                    {...register('cantidad', { required: true, min: 1 })}
                    className={`w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${errors.cantidad ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm sm:text-base text-gray-700 font-semibold">Fecha de Caducidad</label>
                <input
                    type="date"
                    {...register('fechaCaducidad', { required: true })}
                    className={`w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${errors.fechaCaducidad ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
            </div>
            <div className="flex justify-center sm:justify-end">
              <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 sm:px-6 py-2 bg-primary-700 text-white text-sm sm:text-base rounded-lg font-semibold shadow transition hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Registrar Donación
              </button>
            </div>
          </form>
        </section>

        {/* Donaciones recientes */}
        <section className="bg-white rounded-xl shadow-lg px-4 sm:px-8 py-5 sm:py-7">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-800 mb-3 sm:mb-4">Donaciones Recientes</h2>
          {donacionesRecientes.length === 0 ? (
              <p className="text-gray-500 text-sm sm:text-base">No hay donaciones recientes registradas.</p>
          ) : (
              <ul className="space-y-3">
                {donacionesRecientes.map((donacion, index) => (
                    <li
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-green-50 border border-green-100 rounded-lg px-3 sm:px-4 py-2 sm:py-3 shadow-sm"
                    >
                      <div>
                        <p className="font-semibold text-primary-700 text-sm sm:text-base">{donacion.nombre}</p>
                        <span className="text-xs sm:text-sm text-gray-600">Cantidad: {donacion.cantidad}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-mono mt-1 sm:mt-0">
                  {new Date(donacion.fecha).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                    </li>
                ))}
              </ul>
          )}
        </section>


        {/* Historial completo de donaciones */}
        <section className="bg-white rounded-xl shadow-lg px-4 sm:px-8 py-5 sm:py-7">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-primary-800">Historial de Donaciones</h2>
            <button
              onClick={() => {
                console.log('Botón Actualizar historial clickeado');
                void fetchDonaciones(true);
              }}
              disabled={loadingDonaciones}
              className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg font-medium shadow transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loadingDonaciones ? (
                <>
                  <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  Cargando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualizar
                </>
              )}
            </button>
          </div>

          <input
              type="text"
              placeholder="Buscar donaciones por nombre..."
              value={searchDonacionesTerm}
              onChange={(e) => {
                console.log('Cambiando término de búsqueda a:', e.target.value);
                setSearchDonacionesTerm(e.target.value);
              }}
              className="w-full rounded-lg border px-3 py-2 mb-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-400 border-gray-300"
          />

          {/* Evaluación de condiciones de renderizado para el historial */}
          {/* Muestra el error si existe */}
          {errorDonaciones && (
            <div className="text-center text-red-500 py-4 font-semibold">
              <p>{errorDonaciones}</p>
              <button onClick={() => void fetchDonaciones(true)} className="mt-2 text-blue-600 underline">
                Reintentar
              </button>
            </div>
          )}

          {loadingDonaciones && !errorDonaciones && (
            <div className="text-center text-gray-500 py-4">
              Cargando historial...
            </div>
          )}

          {!loadingDonaciones && !errorDonaciones && filteredDonaciones.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <div className="hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Medicamento
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDonaciones.map((donacion) => (
                        <tr key={donacion.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{donacion.nombre}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">{donacion.cantidad}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(donacion.fecha).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {filteredDonaciones.map((donacion) => (
                    <div key={donacion.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="font-medium text-gray-900 text-sm mb-1">{donacion.nombre}</div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">Cantidad: {donacion.cantidad}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(donacion.fecha).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          )}

          {/* Muestra mensaje si no está cargando, no hay error y no hay datos */}
          {!loadingDonaciones && !errorDonaciones && filteredDonaciones.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No hay donaciones que coincidan con la búsqueda.
            </div>
          )}
        </section>
      </div>
  );
};

export default DonacionesMedicamentos;
