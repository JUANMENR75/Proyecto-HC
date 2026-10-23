import React from 'react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import logo from '/SGM_ICON.png';

// --- Icono de Compartir de iOS ---
const IosShareIcon = () => (
    <svg
        className="inline-block w-4 h-4 mx-1 align-text-bottom"
        viewBox="0 0 20 20"
        fill="currentColor"
    >
      <path
          fillRule="evenodd"
          d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V4a1 1 0 011-1z"
      />
      <path
          fillRule="evenodd"
          d="M3.5 9.5a1 1 0 011-1h1.5a1 1 0 110 2H4.5a1 1 0 01-1-1zm12 0a1 1 0 011-1h1.5a1 1 0 110 2H16.5a1 1 0 01-1-1z"
      />
    </svg>
);


// --- Componente Principal del Banner ---
export const InstallPwaBanner: React.FC = () => {
  const { banner, hideBanner, promptInstall, isIOSDevice } = usePwaInstall();

  // Si el banner no debe mostrarse, no renderizamos nada.
  if (!banner) return null;

  const handleInstallClick = async () => {
    const isSuccess = await promptInstall();
    if (isSuccess) {
      // Notificación "toast"
      console.log('¡App instalada! Búscala en tu pantalla de inicio.');
    }
  };

  const NonIosContent = (
      <>
        <img src={logo} alt="Logo SGM" className="w-14 h-14 rounded-xl" />
        <div className="flex-1">
          <p className="font-bold text-gray-800">Instalar la aplicación SGM</p>
          <p className="text-sm text-gray-600">Acceso rápido y sin conexión a internet.</p>
        </div>
        <button
            onClick={handleInstallClick}
            className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Instalar
        </button>
      </>
  );

  const IosContent = (
      <div className="text-center">
        <div className="flex justify-center items-center gap-4 mb-3">
          <img src={logo} alt="Logo SGM" className="w-14 h-14 rounded-xl" />
          <div className="text-left">
            <p className="font-bold text-gray-800">Instala la App en tu iPhone</p>
            <p className="text-sm text-gray-600">Sigue estos sencillos pasos:</p>
          </div>
        </div>
        <ol className="text-left text-sm text-gray-700 space-y-2">
          <li>1. Pulsa el botón de Compartir <IosShareIcon /></li>
          <li>2. Desliza hacia arriba y busca la opción</li>
          <li className="font-semibold">"Añadir a la pantalla de inicio"</li>
        </ol>
      </div>
  );

  return (
      // Contenedor base
      <div
          role="dialog"
          aria-labelledby="pwa-install-banner"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[95%] max-w-lg bg-gray-100 rounded-2xl shadow-2xl p-4 flex items-center gap-4 animate-slide-up"
      >
        <button
            onClick={hideBanner}
            aria-label="Cerrar"
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        {isIOSDevice ? IosContent : NonIosContent}
      </div>
  );
};

export default InstallPwaBanner;