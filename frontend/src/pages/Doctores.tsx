import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

type Doctor = {
  id: number;
  nombre: string;
  especialidad: string;
  createdAt: string;
  updatedAt: string;
};

type DoctorFormData = {
  nombre: string;
  especialidad: string;
};

const Doctores = () => {
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DoctorFormData>({
    defaultValues: {
      nombre: '',
      especialidad: ''
    }
  });
  // Obtener datos de doctores
  const fetchDoctores = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/doctores');
      setDoctores(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los doctores');
      toast.error('Error al cargar los doctores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDoctores();
  }, []);

  // Manejar envío del formulario para crear/actualizar
  const onSubmit = async (data: DoctorFormData) => {
    try {
      if (isEditing && currentDoctor) {
        await axios.put(`/api/doctores/${currentDoctor.id}`, data);
        toast.success('Doctor actualizado correctamente');

        // Limpia el formulario y sale del modo edición manualmente.
        setIsEditing(false);
        setCurrentDoctor(null);
        reset({
          nombre: '',
          especialidad: ''
        });

      } else {
        await axios.post('/api/doctores', data);
        toast.success('Doctor creado correctamente');
        reset();
      }

      // Finalmente, actualiza la lista.
      void fetchDoctores();

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al guardar los datos';
      toast.error(errorMessage);
    }
  };

  // Manejar clic en el botón de editar
  const handleEdit = (item: Doctor) => {
    // Primero, resetea el formulario a un estado vacío.
    reset({
      nombre: '',
      especialidad: '',
    });

    // Luego, llena el formulario con los datos del doctor a editar.
    setTimeout(() => {
      setIsEditing(true);
      setCurrentDoctor(item);
      reset({
        nombre: item.nombre,
        especialidad: item.especialidad,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50); // Un pequeño retraso para asegurar que el UI reaccione.
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro que desea eliminar este doctor?')) {
      try {
        await axios.delete(`/api/doctores/${id}`);
        toast.success('Doctor eliminado correctamente');
        void fetchDoctores();
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Error al eliminar el doctor';
        toast.error(errorMessage);
      }
    }
  };

  // Manejar clic en el botón de ver detalles
  const handleViewDetails = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

  // Cancelar edición
  const handleCancel = () => {
    setIsEditing(false);
    setCurrentDoctor(null);
    reset();
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDoctor(null);
  };

  // Filtrar doctores de acuerdo a término de búsqueda
  const filteredDoctores = doctores.filter(
    (doctor) =>
      doctor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && doctores.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      <header className="mb-2">
        <h1 className="text-3xl font-extrabold text-primary-900 mb-1">
          Gestión de Doctores
        </h1>
        <p className="text-lg text-gray-500">
          Administra los doctores del sistema
        </p>
      </header>

      {/* Formulario para crear/editar doctores */}
      <section className="bg-white rounded-xl shadow-lg px-8 py-7">
        <h2 className="text-2xl font-bold text-primary-800 mb-4">
          {isEditing ? 'Editar' : 'Agregar'} Doctor
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nombre" className="block mb-1 text-gray-700 font-semibold">Nombre Completo</label>
              <input
                id="nombre"
                type="text"
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nombre completo del doctor"
                {...register('nombre', { required: 'El nombre es requerido' })}
              />
              {errors.nombre && (
                <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="especialidad" className="block mb-1 text-gray-700 font-semibold">Especialidad</label>
              <input
                id="especialidad"
                type="text"
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${
                  errors.especialidad ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Especialidad médica"
                {...register('especialidad', { required: 'La especialidad es requerida' })}
              />
              {errors.especialidad && (
                <p className="mt-1 text-xs text-red-600">{errors.especialidad.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-primary-700 text-white rounded-lg font-semibold shadow transition hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {isEditing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </section>

      {/* Búsqueda */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <input
          type="text"
          placeholder="Buscar por nombre o especialidad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 border-gray-300"
        />
      </section>

      {/* Lista de doctores */}
      <section className="bg-white rounded-xl shadow-lg px-8 py-7">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin h-12 w-12 border-4 border-t-primary-600 rounded-full border-gray-300" />
          </div>
        ) : filteredDoctores.length === 0 ? (
          <div className="text-center text-gray-500 py-12 text-lg">
            No hay doctores registrados.
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredDoctores.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl px-7 py-6 shadow-md flex flex-col md:flex-row md:items-center md:justify-between border-l-8 border-primary-500"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary-700">{item.nombre}</h3>
                  <p className="mt-1">
                    Especialidad: <span className="text-gray-700">{item.especialidad}</span>
                  </p>
                  <p>
                    Creado: <span className="text-gray-700">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex-shrink-0 flex gap-2">
                  <button
                    onClick={() => handleViewDetails(item)}
                    className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-semibold hover:bg-primary-200 transition"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-semibold hover:bg-primary-200 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal para detalles del doctor */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary-800">Detalles del Doctor</h2>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-400 rounded-full p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="space-y-5 border-l-4 border-primary-500 pl-4">
                <div>
                  <p className="text-sm text-gray-500 font-semibold">Nombre</p>
                  <p className="font-medium text-gray-700 text-lg">{selectedDoctor.nombre}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 font-semibold">Especialidad</p>
                  <p className="font-medium text-gray-700">{selectedDoctor.especialidad}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 font-semibold">Fecha de Registro</p>
                  <p className="font-medium text-gray-700">{new Date(selectedDoctor.createdAt).toLocaleDateString()}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 font-semibold">Última Actualización</p>
                  <p className="font-medium text-gray-700">{new Date(selectedDoctor.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-primary-700 text-white rounded-lg font-semibold shadow transition hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default Doctores;
