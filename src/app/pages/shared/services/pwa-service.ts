import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map, first } from 'rxjs/operators';
import { concat, interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  constructor(
    private swUpdate: SwUpdate,
    private appRef: ApplicationRef
  ) {}

  // Inicializar el Service Worker
  public initPwaPrompt(): void {
    if (!this.swUpdate.isEnabled) {
      console.warn('⚠️ Service Worker no está habilitado');
      return;
    }

    // Verificar actualizaciones cada 6 horas
    const appIsStable$ = this.appRef.isStable.pipe(
      first(isStable => isStable === true)
    );
    const everySixHours$ = interval(6 * 60 * 60 * 1000);
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

    everySixHoursOnceAppIsStable$.subscribe(async () => {
      try {
        const updateFound = await this.swUpdate.checkForUpdate();
        console.log(updateFound ? '✅ Nueva versión disponible' : '✅ Ya estás en la última versión');
      } catch (err) {
        console.error('❌ Error al verificar actualizaciones:', err);
      }
    });

    // Detectar cuando hay una nueva versión
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        map(evt => ({
          type: 'UPDATE_AVAILABLE',
          current: evt.currentVersion,
          available: evt.latestVersion,
        }))
      )
      .subscribe(evt => {
        console.log('🔄 Nueva versión detectada:', evt);
        if (confirm('Nueva versión disponible. ¿Recargar la aplicación?')) {
          window.location.reload();
        }
      });

    // Detectar errores del Service Worker
    this.swUpdate.unrecoverable.subscribe(event => {
      console.error('❌ Error irrecuperable del Service Worker:', event.reason);
      if (confirm('Error crítico. ¿Recargar la aplicación?')) {
        window.location.reload();
      }
    });
  }

  // Verificar si hay conexión
  public isOnline(): boolean {
    return navigator.onLine;
  }

  // Pre-cachear una canción
  public async precacheAudio(url: string): Promise<void> {
    if ('caches' in window) {
      try {
        const cache = await caches.open('archivos-audio');
        await cache.add(url);
        console.log('✅ Audio pre-cacheado:', url);
      } catch (error) {
        console.error('❌ Error al pre-cachear audio:', error);
      }
    }
  }

  // Pre-cachear una imagen
  public async precacheImage(url: string): Promise<void> {
    if ('caches' in window) {
      try {
        const cache = await caches.open('imagenes');
        await cache.add(url);
        console.log('✅ Imagen pre-cacheada:', url);
      } catch (error) {
        console.error('❌ Error al pre-cachear imagen:', error);
      }
    }
  }

  // Limpiar caché antigua
  public async clearOldCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name !== 'archivos-audio' && 
        name !== 'imagenes' && 
        !name.startsWith('ngsw:')
      );
      
      await Promise.all(oldCaches.map(name => caches.delete(name)));
      console.log('🗑️ Caché antigua eliminada:', oldCaches);
    }
  }
}