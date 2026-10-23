import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

type PersonalType = {
  id: number;
  nombre: string;
  puesto: string;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
  };
};

type PersonalFormData = {
  nombre: string;
  puesto: string;
  email: string;
  password: string;
};

const Personal = () => {
  const [personal, setPersonal] = useState<PersonalType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentPersonal, setCurrentPersonal] = useState<PersonalType | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<PersonalFormData>({
    defaultValues: {
      nombre: '',
      puesto: '',
      email: '',
      password: ''
    }
  });

  useEffect(() => {
    void fetchPersonal();
  }, []);

  const fetchPersonal = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/personal');
      setPersonal(response.data);
      setError(null);
    } catch {
      setError('Error al cargar el personal');
      toast.error('Error al cargar el personal');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PersonalFormData) => {
    try {
      if (isEditing && currentPersonal) {
        const payload: Partial<PersonalFormData> = { ...data };
        if (payload.password === '') {
          delete payload.password;
        }

        await axios.put(`/api/personal/${currentPersonal.id}`, payload);
        toast.success('Personal actualizado correctamente');

      } else {
        const createPayload = { ...data, role: 'ENCARGADO' };
        await axios.post('/api/personal', createPayload);
        toast.success('Personal creado correctamente');
      }
      void fetchPersonal();   // Actualiza la lista de datos.
      handleCancel();        // Llama a tu función de limpieza para resetear todo.

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al guardar los datos';
      toast.error(errorMessage);
      console.error('Error en onSubmit:', error);
    }
  };

  const handleEdit = (item: PersonalType) => {
    setIsEditing(true);
    setCurrentPersonal(item);
    reset({
      nombre: item.nombre,
      puesto: item.puesto,
      email: item.user.email,
      password: '',
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro que desea eliminar este miembro del personal?')) {
      try {
        await axios.delete(`/api/personal/${id}`);
        toast.success('Personal eliminado correctamente');
        void fetchPersonal();
      } catch (error: any) {
        // Mostrar mensaje de error específico si está disponible
        const errorMessage = error.response?.data?.message || 'Error al eliminar el personal';
        toast.error(errorMessage);
        console.error('Error al eliminar personal:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentPersonal(null);
    reset({
      nombre: '',
      puesto: '',
      email: '',
      password: ''
    });
  };

  return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        <header className="mb-2">
          <h1 className="text-3xl font-extrabold text-primary-900 mb-1">
            Gestión de Personal
          </h1>
          <p className="text-lg text-gray-500">
            Administra el personal del sistema
          </p>
        </header>

        {/* Formulario */}
        <section className="bg-white rounded-xl shadow-lg px-8 py-7">
          <h2 className="text-2xl font-bold text-primary-800 mb-4">
            {isEditing ? 'Editar' : 'Agregar'} Personal
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 text-gray-700 font-semibold">Nombre</label>
                <input
                    type="text"
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${
                        errors.nombre ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nombre completo"
                    {...register('nombre', { required: 'El nombre es requerido' })}
                />
                {errors.nombre && (
                    <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-gray-700 font-semibold">Puesto</label>
                <input
                    type="text"
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${
                        errors.puesto ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Puesto o cargo"
                    {...register('puesto', { required: 'El puesto es requerido' })}
                />
                {errors.puesto && (
                    <p className="mt-1 text-xs text-red-600">{errors.puesto.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block mb-1 text-gray-700 font-semibold">Correo electrónico</label>
              <input
                  type="email"
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Correo electrónico"
                  {...register('email', { required: 'El correo es requerido' })}
              />
              {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block mb-1 text-gray-700 font-semibold">Contraseña</label>
              <input
                  type="password"
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Contraseña para acceso"
                  {...register('password', {
                    required: isEditing ? false : 'La contraseña es requerida',
                  })}
              />
              {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
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

        {/* Lista de personal */}
        <section className="bg-white rounded-xl shadow-lg px-8 py-7">
          {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin h-12 w-12 border-4 border-t-primary-600 rounded-full border-gray-300" />
              </div>
          ) : personal.length === 0 ? (
              <div className="text-center text-gray-500 py-12 text-lg">
                No hay personal registrado.
              </div>
          ) : (
              <div className="grid gap-6">
                {personal.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white rounded-xl px-7 py-6 shadow-md flex flex-col md:flex-row md:items-center md:justify-between border-l-8 border-primary-500"
                    >
                      <div className="flex-1">
                        {/* El ID permanece oculto pero mantenido para funcionalidad */}
                        <h3 className="text-xl font-bold text-primary-700">{item.nombre}</h3>
                        <p className="mt-1">
                          Puesto: <span className="text-gray-700">{item.puesto}</span>
                        </p>
                        <p>
                          Creado: <span className="text-gray-700">
                            {new Date(item.createdAt).toLocaleDateString('es-MX')}
                          </span>
                        </p>
                      </div>
                      <div className="mt-4 md:mt-0 flex-shrink-0 flex gap-2">
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
        {error && (
            <div className="mt-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
              {error}
            </div>
        )}
      </div>
  );
};

export default Personal;
