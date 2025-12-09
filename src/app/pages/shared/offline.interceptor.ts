// src/app/pages/shared/offline.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, of, from } from 'rxjs';
import { catchError, switchMap, timeout } from 'rxjs/operators';
import { OfflineSyncService } from './services/offline-sync.service';

export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  const offlineSyncService = inject(OfflineSyncService);

  // NO interceptar navegación de Angular ni recursos locales
  if (!req.url.startsWith('http')) {
    return next(req);
  }

  // Solo interceptar peticiones a tu API (no externas)
  const externalApis = [
    'api.deezer.com',
    'deezer.com',
    'dzcdn.net',
    'spotify.com',
    'scdn.co'
  ];
  const isExternalApi = externalApis.some(domain => req.url.includes(domain));
  
  if (isExternalApi) {
    return next(req);
  }

  // Verificar si es una petición que modifica datos (POST, PUT, DELETE)
  const isWriteOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);

  // Si no hay conexión y es una operación de escritura, guardar para después
  if (!navigator.onLine && isWriteOperation) {
    console.log('📡 Sin conexión - Guardando petición:', req.method, req.url);
    
    const headers: Record<string, string | null> = {};
    req.headers.keys().forEach(key => {
      headers[key] = req.headers.get(key);
    });

    return from(
      offlineSyncService.savePendingRequest(
        req.method as 'POST' | 'PUT' | 'DELETE',
        req.url,
        req.body,
        headers
      )
    ).pipe(
      switchMap((id) => {
        return of(new HttpResponse({
          status: 202,
          statusText: 'Guardado para sincronizar',
          body: {
            offline: true,
            pendingId: id,
            message: 'La operación se completará cuando haya conexión',
            data: req.body
          }
        }));
      }),
      catchError(error => {
        console.error('❌ Error al guardar petición offline:', error);
        return throwError(() => new HttpErrorResponse({
          status: 503,
          statusText: 'Service Unavailable',
          error: { message: 'No se pudo guardar la operación offline' }
        }));
      })
    );
  }

  // Si hay conexión, proceder normalmente con timeout
  return next(req).pipe(
    timeout(10000),
    catchError((error: any) => {
      if (isWriteOperation && (error.status === 0 || error.status === 504 || error.name === 'TimeoutError')) {
        console.log('⚠️ Timeout o error de red - Guardando para sincronizar:', req.method, req.url);
        
        const headers: Record<string, string | null> = {};
        req.headers.keys().forEach(key => {
          headers[key] = req.headers.get(key);
        });

        return from(
          offlineSyncService.savePendingRequest(
            req.method as 'POST' | 'PUT' | 'DELETE',
            req.url,
            req.body,
            headers
          )
        ).pipe(
          switchMap((id) => {
            return of(new HttpResponse({
              status: 202,
              statusText: 'Guardado para sincronizar',
              body: {
                offline: true,
                pendingId: id,
                message: 'Error de conexión. La operación se completará cuando haya conexión',
                data: req.body
              }
            }));
          })
        );
      }

      return throwError(() => error);
    })
  );
};