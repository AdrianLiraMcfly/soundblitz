import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está autenticado
  if (!authService.isAuthenticated()) {
    console.warn('⚠️ Usuario no autenticado, redirigiendo a login');
    router.navigate(['/login']);
    return false;
  }

  // Verificar si es admin
  if (!authService.isAdmin()) {
    console.warn('⚠️ Acceso denegado: se requiere rol de administrador');
    router.navigate(['/dashboard']);
    return false;
  }

  console.log('✅ Acceso permitido a ruta de admin');
  return true;
};