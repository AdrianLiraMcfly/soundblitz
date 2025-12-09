// src/app/pages/shared/services/update-notification.service.ts - ACTUALIZADO COMPLETO
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

  private isPWA: boolean = false;
  private isIOS: boolean = false;
  private isAndroid: boolean = false;

  constructor(private swUpdate: SwUpdate) {
    this.detectPlatform();
    this.initUpdateCheck();
  }

  private detectPlatform(): void {
    // Detectar si es PWA instalada
    this.isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                 (window.navigator as any).standalone ||
                 document.referrer.includes('android-app://');

    // Detectar iOS
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Detectar Android
    this.isAndroid = /Android/.test(navigator.userAgent);
  }

  private initUpdateCheck(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    // Verificar actualizaciones cada 2 minutos (más frecuente en PWA)
    const checkInterval = this.isPWA ? 2 * 60 * 1000 : 5 * 60 * 1000;
    interval(checkInterval).subscribe(() => {
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
        
        // Si es PWA, mostrar diálogo inmediatamente
        if (this.isPWA) {
          this.showPWAUpdateDialog();
        } else {
          // En navegador, mostrar notificación push si está permitido
          this.showBrowserNotification();
        }
      });

    // Detectar errores irrecuperables
    this.swUpdate.unrecoverable.subscribe(event => {
      //console.error('❌ Error irrecuperable del Service Worker:', event.reason);
      
      // Diálogo nativo para error crítico
      const shouldReload = confirm(
        '⚠️ SoundBlitz necesita actualizarse\n\n' +
        'Se detectó un error que requiere recargar la aplicación.\n\n' +
        '¿Recargar ahora?'
      );
      
      if (shouldReload) {
        window.location.reload();
      }
    });

    // Verificar inmediatamente al iniciar (después de 3 segundos)
    setTimeout(() => this.checkForUpdates(), 3000);

    // En PWA, verificar al volver a estar visible
    if (this.isPWA) {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          //console.log('👀 App visible, verificando actualizaciones...');
          setTimeout(() => this.checkForUpdates(), 1000);
        }
      });
    }
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
      const notification = new Notification('🎉 Nueva versión disponible', {
        body: 'Hay una actualización de SoundBlitz disponible. Toca para actualizar.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'app-update',
        requireInteraction: true,
        data: { action: 'update' }
      } as NotificationOptions);
      
      // Intentar vibrar en dispositivos compatibles
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      notification.onclick = () => {
        this.activateUpdate();
        notification.close();
      };
    }
  }

  private showPWAUpdateDialog(): void {
    // Diálogo nativo más elegante para PWA
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = this.isIOS;
    const isAndroidDevice = this.isAndroid;

    // Mensaje personalizado según plataforma
    let message = '🎉 Nueva versión disponible\n\n';
    
    if (isIOSDevice) {
      message += 'Hay una actualización de SoundBlitz disponible.\n\n';
      message += '✨ Nuevas características y mejoras te esperan.\n\n';
      message += '¿Actualizar ahora?';
    } else if (isAndroidDevice) {
      message += 'Nueva actualización de SoundBlitz disponible.\n\n';
      message += '✨ Mejoras de rendimiento y nuevas funciones.\n\n';
      message += '¿Actualizar ahora?';
    } else {
      message += 'Nueva actualización de SoundBlitz disponible.\n\n';
      message += 'Incluye mejoras y nuevas características.\n\n';
      message += '¿Actualizar ahora?';
    }

    // Usar setTimeout para que el diálogo no bloquee el UI thread
    setTimeout(() => {
      const shouldUpdate = confirm(message);
      
      if (shouldUpdate) {
        this.activateUpdate();
      } else {
        // Recordar después (5 minutos)
        //console.log('⏰ Actualización pospuesta, recordaremos en 5 minutos');
        setTimeout(() => {
          this.showPWAUpdateDialog();
        }, 5 * 60 * 1000);
      }
    }, 500);
  }

  // Método para forzar la verificación manual
  async forceCheckForUpdates(): Promise<void> {
    //console.log('🔍 Verificando actualizaciones manualmente...');
    const found = await this.checkForUpdates();
    
    if (!found) {
      // Mostrar mensaje nativo de que está actualizado
      alert('✅ Ya estás usando la última versión de SoundBlitz');
    }
  }

  // Obtener estado de la plataforma
  getPlatformInfo(): { isPWA: boolean; isIOS: boolean; isAndroid: boolean } {
    return {
      isPWA: this.isPWA,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid
    };
  }
}