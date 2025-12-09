// src/app/pages/shared/services/pwa-service.ts - ACTUALIZADO
import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map, first } from 'rxjs/operators';
import { concat, interval } from 'rxjs';
import { UpdateNotificationService } from './update-notification.service';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  constructor(
    private swUpdate: SwUpdate,
    private appRef: ApplicationRef,
    private updateNotificationService: UpdateNotificationService
  ) {}

  // Inicializar el Service Worker
  public initPwaPrompt(): void {
    if (!this.swUpdate.isEnabled) {
      //console.warn('⚠️ Service Worker no está habilitado');
      return;
    }

    // El UpdateNotificationService ahora maneja las actualizaciones
    //console.log('✅ PWA Service inicializado');

    // Solicitar permiso para notificaciones
    this.requestNotificationPermission();
  }

  // Solicitar permiso para notificaciones
  public async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      //console.log('🔔 Permiso de notificaciones:', permission);
    }
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
        //console.log('✅ Audio pre-cacheado:', url);
      } catch (error) {
        //console.error('❌ Error al pre-cachear audio:', error);
      }
    }
  }

  // Pre-cachear una imagen
  public async precacheImage(url: string): Promise<void> {
    if ('caches' in window) {
      try {
        const cache = await caches.open('imagenes');
        await cache.add(url);
        //console.log('✅ Imagen pre-cacheada:', url);
      } catch (error) {
        //console.error('❌ Error al pre-cachear imagen:', error);
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
      //console.log('🗑️ Caché antigua eliminada:', oldCaches);
    }
  }

  // Verificar si la app está instalada como PWA
  public isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }

  // Obtener información de la instalación
  public getInstallInfo(): string {
    if (this.isInstalled()) {
      return 'PWA instalada';
    } else {
      return 'Ejecutando en navegador';
    }
  }
}