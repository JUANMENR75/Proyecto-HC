import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from '../auth/AuthContext'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

type EntregaDetalle = {
    id: number
    cantidad: number
    medicamento: { id: number; nombre: string }
}
type Entrega = {
    id: number
    clave: string
    fecha: string
    paciente: { id: number; nombre: string; curp: string }
    doctor:   { id: number; nombre: string; especialidad: string }
    personal: { id: number; nombre: string; puesto: string }
    entregaDetalles: EntregaDetalle[]
}

const EntregasMedicamentos = () => {
    const { } = useAuth()
    const navigate = useNavigate()
    const [entregas, setEntregas] = useState<Entrega[]>([])
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'user' | 'all' | 'patient'>('user')
    const [openMenuId, setOpenMenuId] = useState<number | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const [retryCount, setRetryCount] = useState(0)

    // Estados para la búsqueda de pacientes
    const [searchTerm, setSearchTerm] = useState('')
    const [searchType, setSearchType] = useState<'curp' | 'nombre'>('nombre')
    const [filteredEntregas, setFilteredEntregas] = useState<Entrega[]>([])
    const [isSearchActive, setIsSearchActive] = useState(false)


    const handleNuevaEntrega = () => {
        navigate('/entrega-manual-medicamentos')
    }

    const toggleMenu = (id: number) => {
        setOpenMenuId(openMenuId === id ? null : id)
    }

    const handleEdit = (entrega: Entrega) => {
        navigate('/entrega-manual-medicamentos', { state: { editMode: true, entrega } })
    }

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro que desea eliminar esta entrega?')) {
            try {
                await axios.delete(`/api/entregas/${id}`);
                toast.success('Entrega eliminada correctamente');
                void fetchEntregas();
            } catch (error) {
                toast.error('Error al eliminar la entrega');
            }
        }
    }

    const buscarEntregasPorPaciente = (term: string, type: 'curp' | 'nombre') => {
        if (!term.trim()) {
            setIsSearchActive(false)
            setFilteredEntregas([])
            return
        }

        const termLower = term.toLowerCase().trim()
        const filtered = entregas.filter(entrega => {
            if (type === 'curp') {
                return entrega.paciente.curp.toLowerCase().includes(termLower)
            } else {
                return entrega.paciente.nombre.toLowerCase().includes(termLower)
            }
        })

        setFilteredEntregas(filtered)
        setIsSearchActive(true)

        if (filtered.length === 0) {
            toast.info(`No se encontraron entregas para el paciente con ${type === 'curp' ? 'CURP' : 'nombre'}: ${term}`)
        } else {
            toast.success(`Se encontraron ${filtered.length} entregas para el paciente`)
        }
    }

    const limpiarBusqueda = () => {
        setSearchTerm('')
        setIsSearchActive(false)
        setFilteredEntregas([])
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const fetchEntregas = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const endpoint = viewMode === 'user' ? '/api/entregas/user' : '/api/entregas';
            const response = await axios.get(endpoint);
            const entregasData = response.data.data ? response.data.data : response.data;
            setEntregas(entregasData);
            setRetryCount(0);
        } catch (error) {
            if (retryCount < 2) {
                setRetryCount(prev => prev + 1);
                toast.warning('Reintentando cargar entregas...');
                setTimeout(() => fetchEntregas(), 1500);
            } else {
                toast.error('Error cargando entregas');
                setError('Error cargando entregas');
            }
        } finally {
            setLoading(false);
        }
    }, [viewMode, retryCount]);

    useEffect(() => {
        void fetchEntregas();
    }, [fetchEntregas]);

    const formatDate = (s: string) =>
        new Date(s).toLocaleDateString('es-ES', {
            day:   '2-digit',
            month: '2-digit',
            year:  'numeric',
            hour:  '2-digit',
            minute:'2-digit'
        })

    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-12 w-12 border-4 border-t-primary-600 rounded-full border-gray-300" />
            </div>
        )
    if (error)
        return <div className="text-red-600 text-center py-6 text-lg font-semibold">{error}</div>
    if (entregas.length === 0)
        return <div className="text-center py-12 text-gray-500 text-lg">No hay entregas registradas.</div>

    return (
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
            {/* Encabezado */}
            <header className="mb-2 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-primary-900 mb-1">
                        Entregas de Medicamentos
                    </h1>
                    <p className="text-lg text-gray-500">
                        Consulta el historial de entregas realizadas
                    </p>
                </div>
                {/* --- BOTÓN ELIMINADO --- */}
            </header>

            {/* Opciones de visualización */}
            <section className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-5 mb-4 flex flex-col gap-3 shadow">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">Opciones de visualización</h2>
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={() => {
                            if (viewMode === 'patient') {
                                setSearchTerm('');
                                setIsSearchActive(false);
                                setFilteredEntregas([]);
                            }
                            setViewMode('user');
                        }}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            viewMode === 'user'
                                ? 'bg-primary-700 text-white shadow'
                                : 'bg-white text-primary-700 border border-primary-300 hover:bg-blue-100'
                        }`}
                    >
                        Mis entregas
                    </button>
                    <button
                        onClick={() => {
                            if (viewMode === 'patient') {
                                setSearchTerm('');
                                setIsSearchActive(false);
                                setFilteredEntregas([]);
                            }
                            setViewMode('all');
                        }}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            viewMode === 'all'
                                ? 'bg-primary-700 text-white shadow'
                                : 'bg-white text-primary-700 border border-primary-300 hover:bg-blue-100'
                        }`}
                    >
                        Todas las entregas
                    </button>
                    <button
                        onClick={() => setViewMode('patient')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            viewMode === 'patient'
                                ? 'bg-primary-700 text-white shadow'
                                : 'bg-white text-primary-700 border border-primary-300 hover:bg-blue-100'
                        }`}
                    >
                        Buscar por paciente
                    </button>
                </div>
            </section>

            {viewMode === 'patient' && (
                <section className="bg-green-50 border border-green-200 rounded-xl px-6 py-5 mb-4 flex flex-col gap-3 shadow">
                    <h2 className="text-lg font-semibold text-green-800 mb-2">Buscar entregas por paciente</h2>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Ingrese CURP o nombre del paciente"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="searchByName"
                                    name="searchType"
                                    checked={searchType === 'nombre'}
                                    onChange={() => setSearchType('nombre')}
                                    className="h-4 w-4 text-green-600"
                                />
                                <label htmlFor="searchByName" className="text-sm text-gray-700">Nombre</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="searchByCurp"
                                    name="searchType"
                                    checked={searchType === 'curp'}
                                    onChange={() => setSearchType('curp')}
                                    className="h-4 w-4 text-green-600"
                                />
                                <label htmlFor="searchByCurp" className="text-sm text-gray-700">CURP</label>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => buscarEntregasPorPaciente(searchTerm, searchType)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                                disabled={!searchTerm.trim()}
                            >
                                Buscar
                            </button>
                            <button
                                onClick={limpiarBusqueda}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                                disabled={!isSearchActive}
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                    {isSearchActive && (
                        <div className="mt-2 text-sm text-green-700">
                            <p>
                                Mostrando resultados para {searchType === 'curp' ? 'CURP' : 'nombre'}: <span className="font-semibold">{searchTerm}</span>
                                {' '}({filteredEntregas.length} {filteredEntregas.length === 1 ? 'entrega' : 'entregas'})
                            </p>
                        </div>
                    )}
                </section>
            )}

            <div className="flex justify-end mb-4">
                <button
                    onClick={handleNuevaEntrega}
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold shadow transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <span className="text-lg">+</span> Nueva Entrega
                </button>
            </div>

            <div className="mb-3 text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-base">
                    <span className="font-medium">Mostrando:</span>{' '}
                    {isSearchActive
                        ? `Resultados de búsqueda por ${searchType === 'curp' ? 'CURP' : 'nombre'}: ${searchTerm}`
                        : viewMode === 'user'
                            ? 'Entregas realizadas por mí'
                            : viewMode === 'all'
                                ? 'Todas las entregas'
                                : 'Modo búsqueda por paciente - Ingrese datos para buscar'
                    }
                    <span className="text-gray-500 ml-2">
                        ({isSearchActive ? filteredEntregas.length : entregas.length} {(isSearchActive ? filteredEntregas.length : entregas.length) === 1 ? 'entrega' : 'entregas'})
                    </span>
                </p>
            </div>

            <div className="space-y-7">
                {Array.isArray(isSearchActive ? filteredEntregas : entregas) &&
                    (isSearchActive ? filteredEntregas : entregas).map((e) => (
                        <section
                            key={e.id}
                            className="bg-blue-50 border border-blue-200 rounded-xl px-7 py-6 shadow-sm hover:shadow-lg transition relative"
                        >
                            <div className="absolute top-3 right-3 z-10" ref={openMenuId === e.id ? menuRef : null}>
                                <button
                                    onClick={() => toggleMenu(e.id)}
                                    className="p-1 rounded-full hover:bg-blue-200 transition bg-blue-50"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                </button>

                                {openMenuId === e.id && (
                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                        <div className="py-1">
                                            <button
                                                onClick={() => handleEdit(e)}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-900"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(e.id)}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                            <span className="font-mono bg-primary-700 text-white px-3 py-1 rounded-lg text-sm mb-2 sm:mb-0">
                                {e.clave}
                            </span>
                                <span className="text-gray-700 text-sm font-mono mr-8">{formatDate(e.fecha)}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-800 mb-4 text-sm">
                                <p className="break-words">
                                    <b>Paciente:</b> {e.paciente.nombre} <span className="text-xs text-gray-500">({e.paciente.curp})</span>
                                </p>
                                <p className="break-words">
                                    <b>Doctor:</b> {e.doctor.nombre}{' '}
                                    <span className="text-gray-500 italic text-xs">({e.doctor.especialidad})</span>
                                </p>
                                <p className="break-words">
                                    <b>Personal:</b> {e.personal.nombre}{' '}
                                    <span className="text-gray-500 italic text-xs">({e.personal.puesto})</span>
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2 text-base">Medicamentos entregados:</h3>
                                <ul className="list-disc list-inside text-gray-700 ml-4 text-sm">
                                    {e.entregaDetalles.map((d) => (
                                        <li key={d.id} className="py-1 break-words">
                                            <span className="font-medium">{d.medicamento.nombre}</span>{' '}
                                            <span className="text-gray-600">({d.cantidad})</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    ))}
            </div>
        </div>
    )
}

export default EntregasMedicamentos