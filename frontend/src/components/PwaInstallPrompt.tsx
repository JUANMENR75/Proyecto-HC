import React, { useState, useEffect } from 'react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import logo from '/SGM_ICON.png';

// Iconos
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const IosShareIcon = () => (
    <svg className="inline-block w-4 h-4 mx-1 align-text-bottom" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13 4.5a2.5 2.5 0 11.707 1.707L10.707 9.5H14.5a2.5 2.5 0 010 5h-1.09L10 18.59l-3.41-4.09H3.5a2.5 2.5 0 010-5h3.793L10 7.207l2.293-2.293A2.5 2.5 0 0113 4.5zM4 12a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" fillRule="evenodd"></path>
    </svg>
);

// Hook personalizado para la lógica de cuándo mostrar el prompt
const useInstallTrigger = (canInstall: boolean) => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!canInstall) return;

    // Mostrar después de 5 segundos
    const timer = setTimeout(() => setShowPrompt(true), 5000);

    // O mostrar si el usuario hace scroll
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setShowPrompt(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [canInstall]);

  return showPrompt;
};

// Componente principal
export const PwaInstallPrompt: React.FC = () => {
  const { banner: canInstall, promptInstall, isIOSDevice } = usePwaInstall();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // El hook controla si debe mostrarse algo o no
  const showTrigger = useInstallTrigger(canInstall || isIOSDevice);

  if (!showTrigger || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleInstall = async () => {
    await promptInstall();
    handleDismiss(); // Ocultar el prompt después de aceptar
  };

  // Si no está expandido, muestra solo el botón flotante.
  if (!isExpanded) {
    return (
        <div className="fixed bottom-5 right-5 z-50 group">
          <button
              onClick={() => setIsExpanded(true)}
              aria-label="Instalar aplicación"
              className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110"
          >
            <DownloadIcon />
          </button>
          <div className="absolute right-16 bottom-4 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Instalar aplicación
          </div>
        </div>
    );
  }

  // Si está expandido, muestra la tarjeta completa.
  return (
      <div className="fixed bottom-5 right-5 z-50 w-[90vw] max-w-sm animate-slide-up">
        <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-2xl p-4 flex flex-col gap-4">
          {/* Encabezado */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-800">Instalar la aplicación</h3>
            <button onClick={() => setIsExpanded(false)} aria-label="Cerrar" className="text-gray-400 hover:text-gray-800">
              <CloseIcon />
            </button>
          </div>

          {/* Contenido para Android/Escritorio */}
          {!isIOSDevice && (
              <>
                <div className="flex gap-4 items-center">
                  <img src={logo} alt="App Icon" className="w-16 h-16 rounded-xl shadow-md" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Accede más rápido y usa la app sin conexión. ¡Pesa menos de 1 MB!
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckIcon /> Acceso rápido</span>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckIcon /> Funciona offline</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={handleDismiss} className="text-sm font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">Más tarde</button>
                  <button onClick={handleInstall} className="text-sm font-bold text-white bg-blue-600 px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    <DownloadIcon /> Instalar
                  </button>
                </div>
              </>
          )}

          {/* Contenido para iOS */}
          {isIOSDevice && (
              <div className="text-sm text-gray-700 space-y-2">
                <p>Para instalar la app en tu iPhone, sigue estos pasos:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Pulsa el botón de Compartir <IosShareIcon /> en la barra del navegador.</li>
                  <li>Busca y selecciona la opción <strong>"Añadir a la pantalla de inicio"</strong>.</li>
                </ol>
              </div>
          )}
        </div>
      </div>
  );
};

export default PwaInstallPrompt;