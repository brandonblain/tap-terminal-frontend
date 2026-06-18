import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('--- 🛡️ INSPECTOR DEL GUARD ACTIVADO ---');
  console.log('1. Ruta destino:', state.url);

  // 1. Validar sesión activa
  if (!authService.isLoggedIn()) {
    console.error('❌ Bloqueado por falta de sesión.');
    router.navigate(['/login']);
    return false;
  }

  // 2. Extraer sección requerida resolviendo rutas hijas
  let currentRoute = route;
  while (currentRoute.firstChild) {
    currentRoute = currentRoute.firstChild;
  }
  const requiredSection = currentRoute.data['section'];

  // Si la ruta no pide sección, se concede acceso libre
  if (!requiredSection) {
    return true;
  }

  // 3. Validar Permisos del perfil
  const hasPerm = authService.hasPermission(requiredSection);
  console.log(`¿Tiene permiso para "${requiredSection}"?:`, hasPerm);

  if (!hasPerm) {
    console.warn(`❌ ACCESO DENEGADO a: ${requiredSection}. Buscando zona segura...`);

    // 🔄 ROMPER BUCLE: Conseguimos sus secciones reales del localStorage
    const userData = localStorage.getItem('user_session');
    if (userData) {
      const user = JSON.parse(userData);
      const fallbackSection = user.sections?.[0]; // Tomamos la primera pantalla que SÍ tenga permitida

      if (fallbackSection) {
        // Convierte 'PRODUCTOS' a '/dashboard/productos' dinámicamente
        const safeRoute = `/dashboard/${fallbackSection.toLowerCase()}`;
        console.log(`🚀 Redirigiendo dinámicamente a zona segura: ${safeRoute}`);
        router.navigate([safeRoute]);
        return false;
      }
    }

    // Si de plano está logueado pero no tiene ninguna sección asignada, lo sacamos al login
    console.error('El usuario no tiene ninguna sección asignada. Desconectando...');
    router.navigate(['/login']);
    return false;
  }

  console.log('✅ ACCESO CONCEDIDO a:', requiredSection);
  return true;
};