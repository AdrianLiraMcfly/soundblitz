// src/app/pages/shared/services/update-notification.service.ts
import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, interval } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UpdateNotificationService {
  private updateAvailable$ = new BehaviorSubject<boolean>(false);
  public updateAvailable = this.updateAvailable$.asObservable();

  private versionInfo$ = new BehaviorSubject<any>(null);
  public versionInfo = this.versionInfo$.asObservable();

  constructor(private swUpdate: SwUpdate) {
    this.initUpdateCheck();
  }

  private initUpdateCheck(): void {
    if (!this.swUpdate.isEnabled) {
      //console.warn('⚠️ Service Worker no está habilitado');
      return;
    }

    // Verificar actualizaciones cada 5 minutos
    interval(5 * 60 * 1000).subscribe(() => {
      this.checkForUpdates();
    });

    // Escuchar eventos de nueva versión
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      )
      .subscribe(evt => {
        //console.log('🔄 Nueva versión disponible:', evt);
        
        this.versionInfo$.next({
          current: evt.currentVersion,
          available: evt.latestVersion
        });
        
        this.updateAvailable$.next(true);
        
        // Mostrar notificación del navegador si está permitido
        this.showBrowserNotification();
      });

    // Detectar errores irrecuperables
    this.swUpdate.unrecoverable.subscribe(event => {
      //console.error('❌ Error irrecuperable del Service Worker:', event.reason);
      
      // Mostrar notificación de error
      if (confirm('Se detectó un error crítico. ¿Deseas recargar la aplicación?')) {
        window.location.reload();
      }
    });

    // Verificar inmediatamente al iniciar
    setTimeout(() => this.checkForUpdates(), 1000);
  }

  async checkForUpdates(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return false;
    }

    try {
      const updateFound = await this.swUpdate.checkForUpdate();
      //console.log(updateFound ? '✅ Nueva versión encontrada' : '✅ Ya estás en la última versión');
      return updateFound;
    } catch (err) {
      //console.error('❌ Error al verificar actualizaciones:', err);
      return false;
    }
  }

  async activateUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    try {
      await this.swUpdate.activateUpdate();
      //console.log('✅ Actualización activada');
      
      // Recargar la página
      window.location.reload();
    } catch (err) {
      //console.error('❌ Error al activar actualización:', err);
    }
  }

  dismissUpdate(): void {
    this.updateAvailable$.next(false);
    //console.log('ℹ️ Actualización pospuesta');
  }

  private showBrowserNotification(): void {
    // Solicitar permiso si no se ha hecho
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Mostrar notificación si está permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Nueva versión disponible', {
        body: 'Hay una actualización de SoundBlitz disponible. Haz clic para actualizar.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'app-update',
        requireInteraction: true
      });

      notification.onclick = () => {
        this.activateUpdate();
        notification.close();
      };
    }
  }

  // Método para forzar la verificación manual
  async forceCheckForUpdates(): Promise<void> {
    //console.log('🔍 Verificando actualizaciones manualmente...');
    const found = await this.checkForUpdates();
    
    if (!found) {
      alert('Ya estás usando la última versión de SoundBlitz');
    }
  }
}