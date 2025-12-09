// src/app/pages/shared/services/update-notification.service.ts - ACTUALIZADO PARA iOS
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

  // Para iOS - verificar versión manualmente
  private currentVersion = '1.0.0'; // Actualiza esto en cada release
  private versionCheckUrl = '/version.json'; // Archivo que tendrás en /public

  constructor(private swUpdate: SwUpdate) {
    this.detectPlatform();
    this.initUpdateCheck();
  }

  private detectPlatform(): void {
    this.isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                 (window.navigator as any).standalone ||
                 document.referrer.includes('android-app://');

    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    this.isAndroid = /Android/.test(navigator.userAgent);
  }

  private initUpdateCheck(): void {
    // Para iOS PWA, usar verificación manual de versión
    if (this.isPWA && this.isIOS) {
      this.initIOSUpdateCheck();
      return;
    }

    // Para Android PWA y navegadores, usar Service Worker
    if (!this.swUpdate.isEnabled) {
      // Fallback a verificación manual
      if (this.isPWA) {
        this.initIOSUpdateCheck();
      }
      return;
    }

    // Verificar actualizaciones cada 2 minutos
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
        
        this.versionInfo$.next({
          current: evt.currentVersion,
          available: evt.latestVersion
        });
        
        this.updateAvailable$.next(true);
        
        if (this.isPWA) {
          this.showPWAUpdateDialog();
        } else {
          this.showBrowserNotification();
        }
      });

    // Detectar errores irrecuperables
    this.swUpdate.unrecoverable.subscribe(event => {
      
      const shouldReload = confirm(
        '⚠️ SoundBlitz necesita actualizarse\n\n' +
        'Se detectó un error que requiere recargar la aplicación.\n\n' +
        '¿Recargar ahora?'
      );
      
      if (shouldReload) {
        window.location.reload();
      }
    });

    // Verificar inmediatamente al iniciar
    setTimeout(() => this.checkForUpdates(), 3000);

    // Verificar al volver a estar visible
    if (this.isPWA) {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          setTimeout(() => this.checkForUpdates(), 1000);
        }
      });
    }
  }

  // ✅ Verificación manual para iOS PWA
  private initIOSUpdateCheck(): void {
    
    // Verificar cada 3 minutos
    interval(3 * 60 * 1000).subscribe(() => {
      this.checkManualVersion();
    });

    // Verificar al volver a estar visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(() => this.checkManualVersion(), 1000);
      }
    });

    // Verificar inmediatamente
    setTimeout(() => this.checkManualVersion(), 3000);

    // Verificar al hacer focus en la ventana
    window.addEventListener('focus', () => {
      setTimeout(() => this.checkManualVersion(), 500);
    });

    // Verificar al hacer touchstart (cuando el usuario toca la app)
    let lastCheck = 0;
    document.addEventListener('touchstart', () => {
      const now = Date.now();
      // Solo verificar cada 2 minutos para no saturar
      if (now - lastCheck > 2 * 60 * 1000) {
        lastCheck = now;
        setTimeout(() => this.checkManualVersion(), 500);
      }
    }, { passive: true });
  }

  // ✅ Verificar versión manualmente contra el servidor
  private async checkManualVersion(): Promise<void> {
    try {
      // Añadir timestamp para evitar caché
      const timestamp = new Date().getTime();
      const response = await fetch(`${this.versionCheckUrl}?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const serverVersion = data.version;

      if (this.isNewerVersion(serverVersion, this.currentVersion)) {
        this.versionInfo$.next({
          current: this.currentVersion,
          available: serverVersion
        });
        this.updateAvailable$.next(true);
        this.showPWAUpdateDialog();
      } else {
      }
    } catch (error) {
    }
  }

  // ✅ Comparar versiones semánticas (1.0.0 vs 1.0.1)
  private isNewerVersion(serverVersion: string, currentVersion: string): boolean {
    const server = serverVersion.split('.').map(Number);
    const current = currentVersion.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (server[i] > current[i]) return true;
      if (server[i] < current[i]) return false;
    }
    return false;
  }

  async checkForUpdates(): Promise<boolean> {
    // Para iOS PWA, usar verificación manual
    if (this.isPWA && this.isIOS) {
      await this.checkManualVersion();
      return this.updateAvailable$.value;
    }

    // Para otros casos, usar Service Worker
    if (!this.swUpdate.isEnabled) {
      return false;
    }

    try {
      const updateFound = await this.swUpdate.checkForUpdate();
      return updateFound;
    } catch (err) {
      return false;
    }
  }

  async activateUpdate(): Promise<void> {
    //console.log('🔄 Activando actualización...');

    // Para iOS PWA, simplemente recargar
    if (this.isPWA && this.isIOS) {
      
      // Limpiar todos los cachés
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        //console.log('🗑️ Cachés limpiados');
      }
      
      // Limpiar localStorage de versión si existe
      localStorage.removeItem('app-version');
      
      // Forzar recarga sin caché
      window.location.href = window.location.href + '?v=' + Date.now();
      return;
    }

    // Para Android PWA y navegadores
    if (!this.swUpdate.isEnabled) {
      window.location.reload();
      return;
    }

    try {
      await this.swUpdate.activateUpdate();
      //console.log('✅ Actualización activada');
      window.location.reload();
    } catch (err) {
      //console.error('❌ Error al activar actualización:', err);
      window.location.reload();
    }
  }

  dismissUpdate(): void {
    this.updateAvailable$.next(false);
    //console.log('ℹ️ Actualización pospuesta');
  }

  private showBrowserNotification(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🎉 Nueva versión disponible', {
        body: 'Hay una actualización de SoundBlitz disponible. Toca para actualizar.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'app-update',
        requireInteraction: true,
        data: { action: 'update' }
      } as NotificationOptions);
      
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
    const isIOSDevice = this.isIOS;
    const isAndroidDevice = this.isAndroid;

    let message = '🎉 Nueva versión disponible\n\n';
    
    if (isIOSDevice) {
      message += 'Hay una actualización de SoundBlitz disponible.\n\n';
      message += '✨ Nuevas características y mejoras te esperan.\n\n';
      message += 'La app se recargará para aplicar los cambios.\n\n';
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

    setTimeout(() => {
      const shouldUpdate = confirm(message);
      
      if (shouldUpdate) {
        this.activateUpdate();
      } else {
        //console.log('⏰ Actualización pospuesta, recordaremos en 5 minutos');
        setTimeout(() => {
          this.showPWAUpdateDialog();
        }, 5 * 60 * 1000);
      }
    }, 500);
  }

  async forceCheckForUpdates(): Promise<void> {
    //console.log('🔍 Verificando actualizaciones manualmente...');
    const found = await this.checkForUpdates();
    
    if (!found && !this.updateAvailable$.value) {
      alert('✅ Ya estás usando la última versión de SoundBlitz');
    }
  }

  getPlatformInfo(): { isPWA: boolean; isIOS: boolean; isAndroid: boolean } {
    return {
      isPWA: this.isPWA,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid
    };
  }
}