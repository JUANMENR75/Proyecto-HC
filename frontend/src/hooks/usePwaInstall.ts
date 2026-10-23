import { useState, useEffect } from 'react';

// Define la interfaz
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Añade las propiedades gtag, MSStream y standalone al objeto window para TypeScript
declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: any) => void;
    MSStream?: any;
  }

  interface Navigator {
    standalone?: boolean;
  }
}

const DISMISS_KEY = 'pwa-install-dismissed';

// Función para detectar dispositivos iOS
const isIOS = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
};

// Función para detectar el navegador Safari
const isSafari = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes('safari') && !userAgent.includes('chrome');
};

const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  } else {
    // Registra en la consola para desarrollo
    console.log('Evento de analítica:', eventName, eventParams);
  }
};

export const usePwaInstall = () => {
  const [deferredEvt, setDeferredEvt] = useState<BeforeInstallPromptEvent|null>(null);
  // Siempre inicializar banner como false para evitar que se muestre el prompt de instalación
  const [banner, setBanner] = useState(false);
  const [isInstalled, setInstalled] = useState(
    window.matchMedia('(display-mode:standalone)').matches || navigator.standalone
  );
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  
  useEffect(() => {
    // Verifica si el dispositivo es iOS
    setIsIOSDevice(isIOS() && isSafari());

    if (isInstalled) return;

    const onBIP = (e: Event) => {
      e.preventDefault?.();
      setDeferredEvt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', () => { 
      setInstalled(true); 
      // Registra la instalación exitosa
      trackEvent('pwa_installed', { method: 'browser_event' });
    });

    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, [isInstalled]);

  const hideBanner = () => { 
    setBanner(false); 
    localStorage.setItem(DISMISS_KEY, Date.now().toString()); 
  };

  const doInstall = async () => {
    if (!deferredEvt) return false;
    deferredEvt.prompt();
    const { outcome } = await deferredEvt.userChoice;

    // Registra la elección del usuario
    trackEvent('pwa_install_prompt', { 
      outcome: outcome,
      platform: 'unknown'
    });

    hideBanner();
    return outcome === 'accepted';
  };

  return { 
    banner, 
    hideBanner, 
    isInstalled, 
    isIOSDevice,
    promptInstall: doInstall 
  };
};
