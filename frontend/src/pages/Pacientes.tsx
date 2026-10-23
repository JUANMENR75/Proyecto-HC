import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

type Personal = {
  id: number;
  nombre: string;
  puesto: string;
  createdAt: string;
  updatedAt: string;
};

type PersonalFormData = {
  nombre: string;
  puesto: string;
  email: string;
  password: string;
};

const Personal = () => {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentPersonal, setCurrentPersonal] = useState<Personal | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<PersonalFormData>();

  useEffect(() => {
    void fetchPersonal();
  }, []);

   // Función para obtener la lista de personal desde la API
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

   // Función que se ejecuta al enviar el formulario
   // Crea un nuevo registro o actualiza uno existente según el estado isEditing
  const onSubmit = async (data: PersonalFormData) => {
    try {
      if (isEditing && currentPersonal) {
        await axios.put(`/api/personal/${currentPersonal.id}`, data);
        toast.success('Personal actualizado correctamente');
      } else {
        await axios.post('/api/personal', data);
        toast.success('Personal creado correctamente');
      }
      reset();
      setIsEditing(false);
      setCurrentPersonal(null);
      void fetchPersonal();
    } catch {
      toast.error('Error al guardar los datos');
    }
  };

   // Función para iniciar la edición de un registro de personal
  const handleEdit = (item: Personal) => {
    setIsEditing(true);
    setCurrentPersonal(item);
    reset({
      nombre: item.nombre,
      puesto: item.puesto,
      email: '',
      password: '',
    });
  };


   // Función para eliminar un registro de personal
  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro que desea eliminar este personal?')) {
      try {
        await axios.delete(`/api/personal/${id}`);
        toast.success('Personal eliminado correctamente');
        void fetchPersonal();
      } catch {
        toast.error('Error al eliminar el personal');
      }
    }
  };

   // Función para cancelar la edición y limpiar el formulario
  const handleCancel = () => {
    setIsEditing(false);
    setCurrentPersonal(null);
    reset();
  };

  return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-blue-800">Gestión de Personal</h1>

        {/* Formulario */}
        <div className="bg-white p-6 shadow-md rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? 'Editar Personal' : 'Agregar Nuevo Personal'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Nombre</label>
                <input
                    type="text"
                    className={`form-input w-full ${errors.nombre ? 'border-red-500' : ''}`}
                    placeholder="Nombre completo"
                    {...register('nombre', { required: 'El nombre es requerido' })}
                />
                {errors.nombre && (
                    <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 font-medium">Puesto</label>
                <input
                    type="text"
                    className={`form-input w-full ${errors.puesto ? 'border-red-500' : ''}`}
                    placeholder="Puesto o cargo"
                    {...register('puesto', { required: 'El puesto es requerido' })}
                />
                {errors.puesto && (
                    <p className="mt-1 text-xs text-red-600">{errors.puesto.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">Correo electrónico</label>
              <input
                  type="email"
                  className={`form-input w-full ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="Correo electrónico"
                  {...register('email', { required: 'El correo es requerido' })}
                  disabled={isEditing}
              />
              {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block mb-1 font-medium">Contraseña</label>
              <input
                  type="password"
                  className={`form-input w-full ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Contraseña para acceso"
                  {...register('password', {
                    required: isEditing ? false : 'La contraseña es requerida',
                  })}
                  disabled={isEditing}
              />
              {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              {isEditing && (
                  <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
              )}
              <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isEditing ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabla */}
        <div className="bg-white p-4 shadow-md rounded-lg">
          {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin h-8 w-8 border-4 border-t-blue-600 rounded-full" />
              </div>
          ) : (
              /* Detectar móvil */
              (() => {
                const [isMobile, setIsMobile] = React.useState(false);

                React.useEffect(() => {
                  const check = () => setIsMobile(window.innerWidth < 640); // Tailwind sm breakpoint
                  check();
                  window.addEventListener('resize', check);
                  return () => window.removeEventListener('resize', check);
                }, []);

                if (isMobile) {
                  // Cards para móvil
                  return (
                    <div className="flex flex-col gap-3">
                      {personal.length === 0 ? (
                        <div className="py-6 text-center text-gray-400">
                          No hay personal registrado
                        </div>
                      ) : (
                        personal.map((item) => (
                          <div key={item.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center border-b pb-2 mb-1">
                              <span className="font-medium text-blue-900">ID: {item.id}</span>
                              <span className="text-sm text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString('es-MX')}
                              </span>
                            </div>

                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-blue-900">Nombre</span>
                              <span className="text-gray-700 text-right">{item.nombre}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-blue-900">Puesto</span>
                              <span className="text-gray-700 text-right">{item.puesto}</span>
                            </div>

                            <div className="flex justify-center space-x-3 mt-2 pt-2 border-t">
                              <button
                                onClick={() => handleEdit(item)}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                }

                // Tabla en escritorio
                return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-100 text-blue-800 font-semibold">
                      <tr>
                        <th className="py-3 px-2 sm:px-4 text-left">ID</th>
                        <th className="py-3 px-2 sm:px-4 text-left">Nombre</th>
                        <th className="py-3 px-2 sm:px-4 text-left">Puesto</th>
                        <th className="py-3 px-2 sm:px-4 text-left">Creación</th>
                        <th className="py-3 px-2 sm:px-4 text-left">Acciones</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                      {personal.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-5 px-2 text-center text-gray-500">
                              No hay personal registrado
                            </td>
                          </tr>
                      ) : (
                          personal.map((item) => (
                              <tr key={item.id} className="hover:bg-blue-50 transition">
                                <td className="py-3 px-2 sm:px-4">{item.id}</td>
                                <td className="py-3 px-2 sm:px-4">{item.nombre}</td>
                                <td className="py-3 px-2 sm:px-4">{item.puesto}</td>
                                <td className="py-3 px-2 sm:px-4">
                                  {new Date(item.createdAt).toLocaleDateString('es-MX')}
                                </td>
                                <td className="py-3 px-2 sm:px-4">
                                  <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                      Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                          ))
                      )}
                      </tbody>
                    </table>
                  </div>
                );
              })()
          )}
        </div>
        {error && (
            <div className="mt-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
              {error}
            </div>
        )}
      </div>
  );
};

export default Personal;
