# Instrucciones para el Splash Screen de Windows

## Configuración del Splash Screen

Se ha configurado el archivo `pwabuilder-package.json` para utilizar `splash-windows.png` como imagen de splash screen para la versión de Windows de la aplicación.

## Pasos a seguir

1. **Añadir el archivo splash-windows.png**: 
   - Coloca el archivo `splash-windows.png` (el mismo que usas en Android) en el directorio `public` de este proyecto.
   - Asegúrate de que la imagen tenga una resolución adecuada para pantallas de Windows (se recomienda al menos 620x300 píxeles).

2. **Verificar la configuración**:
   - El archivo `pwabuilder-package.json` ya ha sido actualizado para usar `splash-windows.png` como imagen de splash screen.
   - Los íconos SGM_ICON.png y SGM.png ya están configurados correctamente en el manifest.

3. **Generar el paquete de Windows**:
   - Sigue las instrucciones en el archivo `PWABuilder_Instructions.md` para generar el paquete de Windows.
   - PWABuilder detectará automáticamente los íconos y el splash screen configurados.

## Notas adicionales

- El splash screen se mostrará durante al menos 3 segundos al iniciar la aplicación (configurado en `splashScreenMinDuration`).
- Si necesitas ajustar la duración o el comportamiento del splash screen, puedes modificar las propiedades en la sección `splashScreen` del archivo `pwabuilder-package.json`.