import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

interface PendingRequest {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  body?: any;
  headers?: any;
  timestamp: number;
  retries: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  private readonly DB_NAME = 'soundblitz-offline';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'pending-requests';
  private db: IDBDatabase | null = null;

  constructor(private http: HttpClient) {
    this.initDB();
    this.setupOnlineListener();
  }

  // Inicializar IndexedDB
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        ////console.log('✅ IndexedDB inicializada');
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          ////console.log('📦 ObjectStore creado');
        }
      };
    });
  }

  // Configurar listener para cuando vuelve la conexión
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      ////console.log('🌐 Conexión restaurada - Sincronizando peticiones pendientes...');
      this.syncPendingRequests();
    });
  }

  // Verificar si hay conexión
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Guardar petición pendiente
  async savePendingRequest(
    method: 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: any,
    headers?: any
  ): Promise<string> {
    if (!this.db) {
      await this.initDB();
    }

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const request: PendingRequest = {
      id,
      method,
      url,
      body,
      headers,
      timestamp: Date.now(),
      retries: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const addRequest = store.add(request);

      addRequest.onsuccess = () => {
        ////console.log('💾 Petición guardada para sincronizar:', method, url);
        this.showOfflineNotification();
        resolve(id);
      };
      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  // Obtener todas las peticiones pendientes
  async getPendingRequests(): Promise<PendingRequest[]> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Eliminar petición pendiente
  async deletePendingRequest(id: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sincronizar todas las peticiones pendientes
  async syncPendingRequests(): Promise<void> {
    if (!this.isOnline()) {
      ////console.log('📡 Sin conexión - No se puede sincronizar');
      return;
    }

    const pendingRequests = await this.getPendingRequests();
    
    if (pendingRequests.length === 0) {
      ////console.log('✅ No hay peticiones pendientes');
      return;
    }

    ////console.log(`🔄 Sincronizando ${pendingRequests.length} peticiones pendientes...`);
    
    let successCount = 0;
    let failCount = 0;

    for (const request of pendingRequests) {
      try {
        await this.executeRequest(request);
        await this.deletePendingRequest(request.id);
        successCount++;
      } catch (error) {
        ////console.error('❌ Error al sincronizar petición:', error);
        failCount++;
        
        // Incrementar intentos
        request.retries++;
        
        // Si supera 3 intentos, eliminar
        if (request.retries >= 3) {
          ////console.warn('⚠️ Petición eliminada tras 3 intentos fallidos');
          await this.deletePendingRequest(request.id);
        }
      }
    }

    this.showSyncNotification(successCount, failCount);
  }

  // Ejecutar una petición HTTP
  private executeRequest(request: PendingRequest): Promise<any> {
    const headers = new HttpHeaders(request.headers || {});

    switch (request.method) {
      case 'POST':
        return this.http.post(request.url, request.body, { headers }).toPromise();
      case 'PUT':
        return this.http.put(request.url, request.body, { headers }).toPromise();
      case 'DELETE':
        return this.http.delete(request.url, { headers }).toPromise();
      default:
        return Promise.reject(new Error('Método no soportado'));
    }
  }

  // Wrapper para POST con soporte offline
  postWithOfflineSupport(url: string, body: any, headers?: any): Observable<any> {
    if (this.isOnline()) {
      return this.http.post(url, body, { headers }).pipe(
        catchError(error => {
          //console.error('Error en POST, guardando para sincronizar:', error);
          return from(this.savePendingRequest('POST', url, body, headers)).pipe(
            switchMap(() => of({ offline: true, message: 'Guardado para sincronizar' }))
          );
        })
      );
    } else {
      return from(this.savePendingRequest('POST', url, body, headers)).pipe(
        switchMap(() => of({ offline: true, message: 'Guardado para sincronizar cuando haya conexión' }))
      );
    }
  }

  // Wrapper para PUT con soporte offline
  putWithOfflineSupport(url: string, body: any, headers?: any): Observable<any> {
    if (this.isOnline()) {
      return this.http.put(url, body, { headers }).pipe(
        catchError(error => {
          //console.error('Error en PUT, guardando para sincronizar:', error);
          return from(this.savePendingRequest('PUT', url, body, headers)).pipe(
            switchMap(() => of({ offline: true, message: 'Guardado para sincronizar' }))
          );
        })
      );
    } else {
      return from(this.savePendingRequest('PUT', url, body, headers)).pipe(
        switchMap(() => of({ offline: true, message: 'Guardado para sincronizar cuando haya conexión' }))
      );
    }
  }

  // Wrapper para DELETE con soporte offline
  deleteWithOfflineSupport(url: string, headers?: any): Observable<any> {
    if (this.isOnline()) {
      return this.http.delete(url, { headers }).pipe(
        catchError(error => {
          //console.error('Error en DELETE, guardando para sincronizar:', error);
          return from(this.savePendingRequest('DELETE', url, undefined, headers)).pipe(
            switchMap(() => of({ offline: true, message: 'Guardado para sincronizar' }))
          );
        })
      );
    } else {
      return from(this.savePendingRequest('DELETE', url, undefined, headers)).pipe(
        switchMap(() => of({ offline: true, message: 'Guardado para sincronizar cuando haya conexión' }))
      );
    }
  }

  // Mostrar notificación de modo offline
  private showOfflineNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Modo Offline', {
        body: 'La acción se guardó y se completará cuando haya conexión',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      });
    }
  }

  // Mostrar notificación de sincronización completada
  private showSyncNotification(success: number, failed: number): void {
    const message = failed === 0 
      ? `${success} acción${success !== 1 ? 'es' : ''} sincronizada${success !== 1 ? 's' : ''} correctamente`
      : `${success} exitosa${success !== 1 ? 's' : ''}, ${failed} fallida${failed !== 1 ? 's' : ''}`;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Sincronización completada', {
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      });
    }

    //console.log(`✅ Sincronización: ${message}`);
  }

  // Obtener número de peticiones pendientes
  async getPendingCount(): Promise<number> {
    const requests = await this.getPendingRequests();
    return requests.length;
  }

  // Limpiar todas las peticiones pendientes (usar con cuidado)
  async clearAllPending(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        //console.log('🗑️ Todas las peticiones pendientes eliminadas');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
}