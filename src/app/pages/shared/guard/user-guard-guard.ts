import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const userGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ User Guard - Verificando permisos...');

  // Verificar si está autenticado
  if (!authService.isAuthenticated()) {
    console.warn('⚠️ Usuario no autenticado, redirigiendo a login');
    router.navigate(['/login']);
    return false;
  }

  // Verificar que NO sea admin
  if (authService.isAdmin()) {
    console.warn('⚠️ Acceso denegado: esta ruta es solo para usuarios normales');
    router.navigate(['/admin/canciones']);
    return false;
  }

  console.log('✅ Acceso permitido - Usuario normal verificado');
  return true;
};