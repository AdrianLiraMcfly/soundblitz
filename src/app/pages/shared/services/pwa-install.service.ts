// src/app/pages/shared/services/pwa-install.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private canInstall$ = new BehaviorSubject<boolean>(false);
  public canInstall = this.canInstall$.asObservable();

  private isIOS: boolean = false;
  private isAndroid: boolean = false;
  private isMobile: boolean = false;
  private isStandalone: boolean = false;

  constructor() {
    this.detectPlatform();
    this.listenForInstallPrompt();
  }

  private detectPlatform(): void {
    // Detectar iOS
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Detectar Android
    this.isAndroid = /Android/.test(navigator.userAgent);
    
    // Detectar móvil
    this.isMobile = this.isIOS || this.isAndroid || /Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Detectar si ya está instalada como PWA
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');

    console.log('📱 Plataforma PWA detectada:', {
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      isMobile: this.isMobile,
      isStandalone: this.isStandalone
    });
  }

  private listenForInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall$.next(true);
      console.log('✅ beforeinstallprompt capturado - PWA instalable');
    });

    // Detectar cuando se instala
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA instalada correctamente');
      this.deferredPrompt = null;
      this.canInstall$.next(false);
      this.isStandalone = true;
    });
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('⚠️ No hay prompt de instalación disponible');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
      
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        this.canInstall$.next(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error al mostrar prompt de instalación:', error);
      return false;
    }
  }

  getPlatformInfo(): {
    isIOS: boolean;
    isAndroid: boolean;
    isMobile: boolean;
    isStandalone: boolean;
    canInstall: boolean;
  } {
    return {
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      isMobile: this.isMobile,
      isStandalone: this.isStandalone,
      canInstall: this.deferredPrompt !== null
    };
  }

  shouldShowInstallButton(): boolean {
    // Mostrar botón si es móvil, no está instalado y (es Android con prompt o iOS)
    return this.isMobile && !this.isStandalone;
  }
}