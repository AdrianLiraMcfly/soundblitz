import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔐 Guest Guard - Verificando autenticación...');

  // Si está autenticado, redirigir según el rol
  if (authService.isAuthenticated()) {
    console.log('⚠️ Usuario ya autenticado, redirigiendo...');
    
    const isAdmin = authService.isAdmin();
    
    if (isAdmin) {
      console.log('👑 Admin detectado - Redirigiendo a /admin/canciones');
      router.navigate(['/dashboard']);
    } else {
      console.log('👤 Usuario normal - Redirigiendo a /dashboard');
      router.navigate(['/dashboard']);
    }
    
    return false; // Bloquear acceso a la ruta de guest
  }

  console.log('✅ No autenticado - Permitir acceso a página de guest');
  return true; // Permitir acceso si NO está autenticado
};