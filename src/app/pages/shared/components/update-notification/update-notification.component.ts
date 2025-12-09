// src/app/pages/shared/components/update-notification/update-notification.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpdateNotificationService } from '../../services/update-notification.service';
import { OfflineSyncService } from '../../services/offline-sync.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-update-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showUpdateBanner" 
         class="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl animate-slide-down">
      <div class="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between flex-wrap">
          <div class="flex items-center flex-1">
            <!-- Icono animado -->
            <div class="flex-shrink-0 mr-3">
              <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
            
            <div class="flex-1">
              <p class="font-semibold text-sm sm:text-base">
                🎉 Nueva versión disponible
              </p>
              <p class="text-xs sm:text-sm text-green-100 mt-0.5">
                Actualiza para obtener las últimas mejoras y características
              </p>
            </div>
          </div>
          
          <div class="flex items-center space-x-2 mt-2 sm:mt-0 w-full sm:w-auto">
            <!-- Botón Actualizar -->
            <button 
              (click)="onUpdate()"
              class="flex-1 sm:flex-initial px-4 py-2 bg-white text-green-600 rounded-lg font-medium text-sm hover:bg-green-50 transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              <span class="flex items-center justify-center space-x-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                <span>Actualizar ahora</span>
              </span>
            </button>
            
            <!-- Botón Después -->
            <button 
              (click)="onDismiss()"
              class="flex-1 sm:flex-initial px-4 py-2 bg-green-600 text-white border border-white/30 rounded-lg font-medium text-sm hover:bg-green-700 transition duration-200">
              Después
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicador de sincronización offline -->
    <div *ngIf="pendingCount > 0" 
         class="fixed bottom-20 right-4 z-[9999] bg-gray-800 text-white px-4 py-3 rounded-lg shadow-2xl border border-gray-700 animate-slide-up">
      <div class="flex items-center space-x-3">
        <svg class="w-5 h-5 animate-spin text-yellow-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <div class="flex-1">
          <p class="font-medium text-sm">Peticiones pendientes</p>
          <p class="text-xs text-gray-400">{{ pendingCount }} esperando conexión</p>
        </div>
        <button 
          *ngIf="navigator.onLine"
          (click)="syncNow()"
          class="px-2 py-1 bg-green-500 hover:bg-green-600 rounded text-xs font-medium transition">
          Sincronizar
        </button>
      </div>
    </div>

    <!-- Notificación de sincronización exitosa -->
    <div *ngIf="showSyncSuccess" 
         class="fixed bottom-20 right-4 z-[9999] bg-green-600 text-white px-4 py-3 rounded-lg shadow-2xl animate-slide-up">
      <div class="flex items-center space-x-3">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <div>
          <p class="font-medium text-sm">✅ Sincronización completada</p>
          <p class="text-xs text-green-100">Todas las operaciones se completaron</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-down {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes slide-up {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .animate-slide-down {
      animation: slide-down 0.5s ease-out;
    }

    .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }
  `]
})
export class UpdateNotificationComponent implements OnInit, OnDestroy {
  showUpdateBanner = false;
  pendingCount = 0;
  showSyncSuccess = false;
  navigator = window.navigator;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private updateService: UpdateNotificationService,
    private offlineSyncService: OfflineSyncService
  ) {}

  async ngOnInit(): Promise<void> {
    // Suscribirse a actualizaciones disponibles
    this.subscriptions.push(
      this.updateService.updateAvailable.subscribe(available => {
        this.showUpdateBanner = available;
      })
    );

    // Actualizar contador de peticiones pendientes cada 2 segundos
    this.subscriptions.push(
      interval(2000).subscribe(async () => {
        this.pendingCount = await this.offlineSyncService.getPendingCount();
      })
    );

    // Actualizar inmediatamente
    this.pendingCount = await this.offlineSyncService.getPendingCount();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onUpdate(): void {
    this.updateService.activateUpdate();
  }

  onDismiss(): void {
    this.updateService.dismissUpdate();
    this.showUpdateBanner = false;
  }

  async syncNow(): Promise<void> {
    console.log('🔄 Sincronizando manualmente...');
    await this.offlineSyncService.syncPendingRequests();
    this.pendingCount = await this.offlineSyncService.getPendingCount();
    
    // Mostrar notificación de éxito
    this.showSyncSuccess = true;
    setTimeout(() => {
      this.showSyncSuccess = false;
    }, 3000);
  }
}