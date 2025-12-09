// src/app/app.ts - ACTUALIZADO
import { Component, signal, OnInit, OnDestroy} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './pages/shared/services/auth-service';
import { MusicPlayerComponent } from './pages/shared/components/reproductor-component/reproductor-component';
import { PwaService } from './pages/shared/services/pwa-service';
import { OfflineSyncService } from './pages/shared/services/offline-sync.service';
import { UpdateNotificationService } from './pages/shared/services/update-notification.service';
import { UpdateNotificationComponent } from './pages/shared/components/update-notification/update-notification.component';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MusicPlayerComponent, CommonModule, UpdateNotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('soundblitz');
  isAuthenticated: boolean = false;
  isOnline: boolean = navigator.onLine;
  pendingSyncCount: number = 0;
  
  private authSubscription?: Subscription | null = null;

  constructor(
    private pwaService: PwaService,
    private authService: AuthService,
    private offlineSyncService: OfflineSyncService,
    private updateNotificationService: UpdateNotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    // Inicializar PWA
    this.pwaService.initPwaPrompt();

    // Suscribirse a cambios de autenticación
    this.authSubscription = this.authService.currentUser$.subscribe(
      (user) => {
        this.isAuthenticated = !!user;
      }
    );

    // Detectar cambios de conexión
    window.addEventListener('online', async () => {
      //console.log('🌐 Conexión restaurada');
      this.isOnline = true;
      
      // Sincronizar peticiones pendientes
      await this.offlineSyncService.syncPendingRequests();
      this.updatePendingCount();
      
      // Mostrar notificación
      this.showNotification('Conexión restaurada', 'Sincronizando datos...');
    });

    window.addEventListener('offline', () => {
      //console.log('📡 Modo offline activado');
      this.isOnline = false;
      this.showNotification('Modo Offline', 'Los cambios se guardarán para sincronizar después');
    });

    // Actualizar contador de peticiones pendientes
    this.updatePendingCount();
    
    // Verificar actualizaciones al iniciar
    setTimeout(() => {
      this.updateNotificationService.checkForUpdates();
    }, 5000);

    // Log de estado
    //console.log('📱 Modo de ejecución:', this.pwaService.getInstallInfo());
    //console.log('🌐 Estado de conexión:', this.isOnline ? 'Online' : 'Offline');
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  private async updatePendingCount(): Promise<void> {
    this.pendingSyncCount = await this.offlineSyncService.getPendingCount();
  }

  private showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      });
    }
  }
}