import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { useAuth } from '../auth/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

type Medicamento = {
    id: number;
    clave: string;
    nombre: string;
    cantidadActual: number;
    fechaCaducidad: string;
};

type MedicamentoSeleccionado = {
    id: number;
    nombre: string;
    cantidad: number;
};

type Doctor = {
    id: number;
    nombre: string;
    especialidad: string;
};

type Personal = {
    id: number;
    nombre: string;
    userId: number;
};

type EntregaDetalle = {
    medicamento: {
        id: number;
        nombre: string;
    };
    cantidad: number;
};

type Entrega = {
    id: number;
    paciente: {
        nombre: string;
        curp: string;
    };
    doctor: {
        id: number;
    };
    entregaDetalles?: EntregaDetalle[];
    tipoConsulta?: 'general' | 'dental' | 'vales';
};

type ApiResponse = {
    data: {
        clave?: string;
        tipoConsulta?: 'general' | 'dental' | 'vales';
        [key: string]: any;
    };
};

type EntregaManualFormData = {
    nombrePaciente: string;
    curpPaciente: string;
    doctorId: number;
    tipoConsulta: 'general' | 'dental' | 'vales';
};

const EntregaManualMedicamentos = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const editMode = location.state?.editMode || false;
    const entregaToEdit = location.state?.entrega as Entrega | null || null;

    // Usamos el usuario del AuthContext en lugar de localStorage
    // El pid (ID del personal) está disponible en user.pid
    const staffId = user?.pid?.toString() || '';

    // Aseguramos que personal tenga un ID válido cuando el usuario está autenticado
    const personal: Personal | null = user && user.id ? { 
        id: user.id, 
        nombre: user.nombre, 
        userId: user.userId ?? user.id 
    } : null;

    // Log para diagnóstico de problemas con el ID de personal
    if (!staffId && !personal?.id) {
        console.warn("El botón Registrar Entrega está desactivado porque no se encontró un ID de personal válido:", {
            userExists: !!user,
            userIdExists: user ? !!user.id : false,
            userIdValue: user?.id,
            personalObject: personal,
            staffIdExists: !!staffId,
            staffIdValue: staffId
        });
    }
    const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
    const [doctores, setDoctores] = useState<Doctor[]>([]);
    const [medicamentosSeleccionados, setMedicamentosSeleccionados] = useState<
        MedicamentoSeleccionado[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [entregasRecientes, setEntregasRecientes] = useState<
        {
            clave: string;
            paciente: string;
            fecha: string;
            medicamentos: string[];
        }[]
    >([]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<EntregaManualFormData>();

    useEffect(() => {
        if (editMode && entregaToEdit) {
            setValue('nombrePaciente', entregaToEdit.paciente.nombre);
            setValue('curpPaciente', entregaToEdit.paciente.curp);
            setValue('doctorId', entregaToEdit.doctor.id);
            setValue('tipoConsulta', 'general');

            // Obtener los detalles de la entrega para conseguir el tipo de consulta y rellenar medicamentos
            const fetchEntregaDetails = async () => {
                try {
                    const response: ApiResponse = await axios.get(`/api/entregas/${entregaToEdit.id}`, {
                    });

                    if (response.data.tipoConsulta) {
                        setValue('tipoConsulta', response.data.tipoConsulta);
                    }

                    // Rellenar medicamentos seleccionados con los medicamentos de la entrega
                    if (entregaToEdit.entregaDetalles && entregaToEdit.entregaDetalles.length > 0) {
                        const medicamentosFromEntrega = entregaToEdit.entregaDetalles.map((detalle: EntregaDetalle) => ({
                            id: detalle.medicamento.id,
                            nombre: detalle.medicamento.nombre,
                            cantidad: detalle.cantidad
                        }));

                        setMedicamentosSeleccionados(medicamentosFromEntrega);
                    }
                } catch (error) {
                    console.error('Error al obtener detalles de la entrega:', error);
                }
            };
            void fetchEntregaDetails();        }
    }, [editMode, entregaToEdit, setValue]);

    // Obtener Medicamentos
    const fetchMedicamentos = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get<Medicamento[]>('/api/medicamentos');

            setMedicamentos(response.data);
        } catch (_err) {
            setError('Error al cargar medicamentos');
            toast.error('No se pudo cargar el inventario');
        } finally {
            setLoading(false);
        }
    };

    // Obtener Doctores
    const fetchDoctores = async () => {
        try {
            // El navegador se encarga de la autenticación automáticamente.
            const response = await axios.get<Doctor[]>('/api/doctores');

            setDoctores(response.data);
        } catch (_err) {
            toast.error('No se pudieron cargar los doctores');
        }
    };


    // useEffect para cargar medicamentos y doctores
    useEffect(() => {
        (async () => {
            await fetchMedicamentos();
            await fetchDoctores();
        })();
    }, []);


    // Formatear Fecha
    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Agregar Medicamento
    const handleAddMedicamento = (med: Medicamento) => {
        if (medicamentosSeleccionados.some((m) => m.id === med.id)) {
            toast.warning('Este medicamento ya está seleccionado');
            return;
        }
        setMedicamentosSeleccionados((prev) => [
            ...prev,
            { id: med.id, nombre: med.nombre, cantidad: 1 },
        ]);
    };

    // Eliminar Medicamento
    const handleRemoveMedicamento = (id: number) => {
        setMedicamentosSeleccionados((prev) => prev.filter((m) => m.id !== id));
    };

    // Cambio Cantidad
    const handleCantidadChange = (id: number, nuevaCantidad: number) => {
        const medInventario = medicamentos.find((m) => m.id === id);

        if (medInventario) {
            if (nuevaCantidad > medInventario.cantidadActual) {
                toast.warning(
                    `Solo hay ${medInventario.cantidadActual} unidades disponibles`
                );
                nuevaCantidad = medInventario.cantidadActual;
            }
            if (nuevaCantidad < 1) nuevaCantidad = 1;
        }

        setMedicamentosSeleccionados((prev) =>
            prev.map((m) =>
                m.id === id
                    ? {
                        ...m,
                        cantidad: nuevaCantidad,
                    }
                    : m
            )
        );
    };

    // Registrar o actualizar entrega
    const onSubmit = async (form: EntregaManualFormData) => {
        if (medicamentosSeleccionados.length === 0) {
            toast.error('Debe seleccionar al menos un medicamento');
            return;
        }

        // Verifica que tengamos el ID de Personal (ya sea de pid o de personal.id)
        if (!staffId && !personal?.id) {
            toast.error('Error: No se pudo obtener el id de Personal');
            return;
        }

        try {
            const data = {
                paciente: {
                    nombre: form.nombrePaciente,
                    curp: form.curpPaciente,
                },
                doctorId: Number(form.doctorId),
                tipoConsulta: form.tipoConsulta,
                personalId: staffId || personal?.id, // Usamos el pid (ID del personal) del AuthContext o el ID del usuario como respaldo
                medicamentos: medicamentosSeleccionados.map((m) => ({
                    id: Number(m.id),
                    cantidad: Number(m.cantidad),
                })),
            };

            console.log('ID personal a enviar:', staffId || personal?.id); // Verificación de ID válido
            console.log("Datos a enviar al backend:", data);
            console.log("ID de Personal utilizado (pid):", staffId || personal?.id);

            let response: ApiResponse;

            if (editMode && entregaToEdit) {
                // Actualizar entrega existente usando el endpoint manual ya que no hay endpoint PUT
                // Incluimos el ID de la entrega en los datos para identificar qué entrega actualizar
                const updateData = {
                    ...data,
                    entregaId: entregaToEdit.id // Incluir el ID para identificar qué entrega actualizar
                };

                // Actualizar entrega existente
                response = await axios.post(
                    '/api/entregas/manual',
                    updateData
                );
                
                toast.success('Entrega actualizada correctamente');
            } else {
                // Crear nueva entrega
                response = await axios.post(
                    '/api/entregas/manual',
                    data
                );

                // Agregamos la nueva entrega al array de entregas recientes
                setEntregasRecientes((prev) => [
                    {
                        clave: response.data.clave || 'N/A',
                        paciente: form.nombrePaciente,
                        fecha: new Date().toISOString(),
                        medicamentos: medicamentosSeleccionados.map((m) => m.nombre),
                    },
                    ...prev,
                ]);

                toast.success('Entrega manual registrada correctamente');
            }

            // Limpiamos el formulario y seleccionados
            reset();
            setMedicamentosSeleccionados([]);
            setSearchTerm('');

            // Volvemos a cargar inventario
            await fetchMedicamentos();

            // Sí estábamos en modo edición, volver a la lista
            if (editMode) {
                navigate('/entregas-medicamentos');
            }
        } catch (err) {
            console.error('Error al procesar entrega:', err);

            // Extraer mensaje de error detallado si está disponible
            let errorMessage = editMode 
                ? 'Error al actualizar la entrega' 
                : 'Error al registrar la entrega manual';

            if (axios.isAxiosError(err) && err.response) {
                const responseData = err.response.data;
                if (responseData.error) {
                    errorMessage = `${responseData.message}: ${responseData.error}`;
                    console.error('Detalle del error:', responseData.error);
                }
            }

            toast.error(errorMessage);
        }
    };

    // Filtrados: lista de medicamentos con buscador
    const filtered = medicamentos.filter(
        (m) =>
            m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.clave.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Indicador de carga
    if (loading && medicamentos.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-12 w-12 border-4 border-t-primary-600 rounded-full border-gray-300" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
            {/* Encabezado */}
            <header className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-primary-900 mb-2">
                        {editMode ? 'Editar Entrega' : 'Registrar Entrega de Medicamentos'}
                    </h1>
                    <p className="text-lg text-gray-500">
                        Llena los datos y selecciona los medicamentos a entregar
                    </p>
                </div>
            </header>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow">
                    {error}
                </div>
            )}


            {/* Formulario */}
            <section className="bg-white rounded-xl shadow-lg px-8 py-7">
                <h2 className="text-2xl font-bold text-primary-800 mb-4">
                    Datos de la Entrega
                </h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-1 text-gray-700 font-semibold">
                                Nombre del Paciente
                            </label>
                            <input
                                {...register('nombrePaciente', { required: true })}
                                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${
                                    errors.nombrePaciente ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Ejemplo: Juan Pérez"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-gray-700 font-semibold">
                                CURP del Paciente
                            </label>
                            <input
                                {...register('curpPaciente', { 
                                    required: "La CURP es obligatoria",
                                    pattern: {
                                        value: /^[A-Z]{4}[0-9]{6}[HM][A-Z]{2}[BCDFGHJKLMNPQRSTVWXYZ]{3}[0-9A-Z][0-9]$/,
                                        message: "La CURP no tiene un formato válido"
                                    },
                                    maxLength: {
                                        value: 18,
                                        message: "La CURP debe tener 18 caracteres"
                                    },
                                    minLength: {
                                        value: 18,
                                        message: "La CURP debe tener 18 caracteres"
                                    }
                                })}
                                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${
                                    errors.curpPaciente ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Ejemplo: CURP123456HDFRRL09"
                            />
                            {errors.curpPaciente && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.curpPaciente.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block mb-1 text-gray-700 font-semibold">
                                Doctor
                            </label>
                            <select
                                {...register('doctorId', { required: true })}
                                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${
                                    errors.doctorId ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Seleccione un doctor</option>
                                {doctores.map((doctor) => (
                                    <option key={doctor.id} value={doctor.id}>
                                        {doctor.nombre} - {doctor.especialidad}
                                    </option>
                                ))}
                            </select>
                            {errors.doctorId && (
                                <p className="mt-1 text-sm text-red-600">
                                    Debe seleccionar un doctor
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block mb-1 text-gray-700 font-semibold">
                                Tipo de Consulta
                            </label>
                            <select
                                {...register('tipoConsulta', { required: true })}
                                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${
                                    errors.tipoConsulta ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="general">Consulta General</option>
                                <option value="dental">Dental</option>
                                <option value="vales">Vales</option>
                            </select>
                        </div>
                    </div>

                    {/* Medicamentos seleccionados */}
                    <div className="mt-6">
                        <h3 className="font-semibold text-gray-700 mb-2">
                            Medicamentos Seleccionados
                        </h3>
                        {medicamentosSeleccionados.length === 0 ? (
                            <p className="text-gray-500 italic">
                                No hay medicamentos seleccionados
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {medicamentosSeleccionados.map((m) => (
                                    <li
                                        key={m.id}
                                        className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 shadow-sm"
                                    >
                    <span className="font-medium text-primary-700">
                      {m.nombre}
                    </span>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => handleCantidadChange(m.id, m.cantidad - 1)}
                                                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition"
                                                aria-label="Disminuir cantidad"
                                            >
                                                –
                                            </button>
                                            <span className="w-8 text-center font-bold">
                        {m.cantidad}
                      </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCantidadChange(m.id, m.cantidad + 1)}
                                                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition"
                                                aria-label="Aumentar cantidad"
                                            >
                                                +
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMedicamento(m.id)}
                                                className="ml-3 text-red-600 hover:bg-red-100 rounded-full px-2 py-1 transition"
                                                aria-label="Quitar medicamento"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="flex flex-col items-end">
                        <button
                            type="submit"
                            disabled={!staffId && !personal?.id}
                            className={`inline-flex items-center px-6 py-2 rounded-lg font-semibold shadow transition focus:outline-none focus:ring-2 ${
                                !staffId && !personal?.id
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-primary-700 text-white hover:bg-primary-800 focus:ring-primary-500'
                            }`}
                        >
                            {editMode ? 'Actualizar' : 'Registrar Entrega'}
                        </button>
                        {!staffId && !personal?.id && (
                            <p className="text-red-500 text-sm mt-2">
                                Error: No se pudo obtener su ID de personal. Por favor, cierre sesión y vuelva a iniciar sesión.
                            </p>
                        )}
                    </div>
                </form>
            </section>

            {/* Buscador de medicamentos */}
            <section className="bg-white rounded-xl shadow-lg px-8 py-7">
                <h2 className="text-2xl font-bold text-primary-800 mb-4">
                    Buscar Medicamentos
                </h2>
                <input
                    type="text"
                    placeholder="Buscar por nombre o clave..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-400 border-gray-300"
                />
                {/* Lista de medicamentos filtrados */}
                <div className="max-h-60 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">
                            No se encontraron medicamentos
                        </p>
                    ) : (
                        <ul className="grid gap-3">
                            {filtered.map((med) => (
                                <li
                                    key={med.id}
                                    className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 shadow-sm hover:bg-blue-100 transition"
                                >
                                    <div>
                                        <p className="text-xs font-mono text-gray-500">{med.clave}</p>
                                        <p className="font-semibold text-primary-700">{med.nombre}</p>
                                        <p className="text-sm">
                                            Disponible:{' '}
                                            <span
                                                className={
                                                    med.cantidadActual < 10
                                                        ? 'text-orange-600 font-semibold'
                                                        : 'text-gray-700'
                                                }
                                            >
                        {med.cantidadActual}
                      </span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleAddMedicamento(med)}
                                        disabled={med.cantidadActual <= 0}
                                        className={`px-5 py-1.5 rounded-lg font-semibold shadow text-sm transition ${
                                            med.cantidadActual <= 0
                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                : 'bg-primary-700 text-white hover:bg-primary-800'
                                        }`}
                                    >
                                        {med.cantidadActual <= 0 ? 'Sin stock' : 'Agregar'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            {/* Entregas recientes */}
            {entregasRecientes.length > 0 && (
                <section className="bg-white rounded-xl shadow-lg px-8 py-7">
                    <h2 className="text-2xl font-bold text-primary-800 mb-4">
                        Entregas Recientes
                    </h2>
                    <ul className="space-y-4">
                        {entregasRecientes.map((entrega, index) => (
                            <li
                                key={index}
                                className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 shadow-sm"
                            >
                                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono bg-primary-700 text-white px-3 py-1 rounded-lg text-sm">
                    {entrega.clave}
                  </span>
                                    <span className="text-gray-700 text-sm font-mono">
                    {formatDate(entrega.fecha)}
                  </span>
                                </div>
                                <p>
                                    <b>Paciente:</b> {entrega.paciente}
                                </p>
                                <div className="mt-2">
                                    <h3 className="font-semibold text-gray-700 mb-1">
                                        Medicamentos:
                                    </h3>
                                    <ul className="list-disc list-inside text-gray-700 ml-4">
                                        {entrega.medicamentos.map((med, i) => (
                                            <li key={i} className="py-0.5">
                                                {med}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

export default EntregaManualMedicamentos;
