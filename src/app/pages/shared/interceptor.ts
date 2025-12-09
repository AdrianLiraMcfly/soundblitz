// src/app/pages/shared/interceptor.ts - ACTUALIZADO
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const sessionInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  // NO interceptar navegación de Angular ni recursos locales
  if (!req.url.startsWith('http')) {
    return next(req);
  }

  // Lista de rutas públicas de TU API que NO requieren token
  const publicUrls = ['/api/login', '/api/register', '/api/registro', '/api/recuperar-password'];
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));

  // Excluir APIs externas
  const externalApis = [
    'api.deezer.com',
    'deezer.com',
    'dzcdn.net',
    'spotify.com',
    'scdn.co'
  ];
  const isExternalApi = externalApis.some(domain => req.url.includes(domain));

  // Si es API externa, dejar pasar sin token
  if (isExternalApi) {
    return next(req);
  }

  // Si no hay token y no es una URL pública, redirigir a login
  if (!token && !isPublicUrl) {
    console.warn('⚠️ No hay token, redirigiendo a login');
    router.navigate(['/login']);
    return throwError(() => new HttpErrorResponse({ 
      status: 401, 
      statusText: 'No autorizado' 
    }));
  }

  // Si hay token, agregarlo al header SOLO para tu API
  let authReq = req;
  if (token && !isPublicUrl) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Ejecutar la petición y manejar errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo procesar errores de TU API
      if (!isExternalApi && (error.status === 401 || error.status === 403)) {
        console.error('❌ Sesión inválida o expirada');
        
        // Limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        
        // Redirigir a login
        router.navigate(['/login'], { 
          queryParams: { 
            sessionExpired: 'true',
            returnUrl: router.url 
          } 
        });
      }
      
      return throwError(() => error);
    })
  );
};