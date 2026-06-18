import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('--- 🛡️ INSPECTOR DEL GUARD ACTIVADO ---');
  console.log('1. Ruta destino:', state.url);

  // 1. Validar si está logueado
  if (!authService.isLoggedIn()) {
    console.error('❌ Bloqueado por falta de sesión.');
    router.navigate(['/login']);
    return false;
  }

  // 👇 EL TRUCO PARA RUTAS HIJAS: Buscamos la data recorriendo los hijos activos 👇
  let currentRoute = route;
  while (currentRoute.firstChild) {
    currentRoute = currentRoute.firstChild;
  }
  
  // Ahora sí extraemos la sección del eslabón correcto
  const requiredSection = currentRoute.data['section'];
  console.log('3. Sección recuperada de la ruta hija:', requiredSection);

  // Si no pide sección (como la raíz del dashboard), pasa limpio
  if (!requiredSection) {
    console.log('✅ Ruta libre. Acceso concedido.');
    return true;
  }

  // 3. Validar Permisos
  const hasPerm = authService.hasPermission(requiredSection);
  console.log(`4. ¿Tiene permiso para "${requiredSection}"?:`, hasPerm);

  if (!hasPerm) {
    console.error(`❌ ACCESO DENEGADO a: ${requiredSection}. Redirigiendo...`);
    router.navigate(['/dashboard']); // O la ruta base de tu menú
    return false;
  }

  console.log('✅ ACCESO CONCEDIDO a:', requiredSection);
  return true;
};