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
  isFormData?: boolean; // ✅ NUEVO: Indica si es FormData
  formDataFields?: { key: string; value: any; isFile?: boolean; fileName?: string }[]; // ✅ NUEVO: Para reconstruir FormData
}

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  private readonly DB_NAME = 'soundblitz-offline';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'pending-requests';
  private db: IDBDatabase | null = null;
  private isSyncing = false;

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
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Configurar listener para cuando vuelve la conexión
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      //console.log('🌐 Conexión restaurada - Sincronizando automáticamente...');
      this.syncPendingRequests();
    });

    // Verificar peticiones pendientes al iniciar si hay conexión
    if (this.isOnline()) {
      setTimeout(() => this.syncPendingRequests(), 2000);
    }
  }

  // Verificar si hay conexión
  isOnline(): boolean {
    return navigator.onLine;
  }

  // ✅ NUEVO: Convertir FormData a formato serializable
  private async serializeFormData(formData: FormData): Promise<{ key: string; value: any; isFile?: boolean; fileName?: string }[]> {
    const fields: { key: string; value: any; isFile?: boolean; fileName?: string }[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Convertir archivo a base64
        const base64 = await this.fileToBase64(value);
        fields.push({
          key,
          value: base64,
          isFile: true,
          fileName: value.name
        });
      } else {
        fields.push({
          key,
          value: value
        });
      }
    }
    
    return fields;
  }

  // ✅ NUEVO: Convertir File a base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ✅ NUEVO: Reconstruir FormData desde campos serializados
  private async reconstructFormData(fields: { key: string; value: any; isFile?: boolean; fileName?: string }[]): Promise<FormData> {
    const formData = new FormData();
    
    for (const field of fields) {
      if (field.isFile && field.fileName) {
        // Convertir base64 de vuelta a File
        const file = await this.base64ToFile(field.value, field.fileName);
        formData.append(field.key, file, field.fileName);
      } else {
        formData.append(field.key, field.value);
      }
    }
    
    return formData;
  }

  // ✅ NUEVO: Convertir base64 a File
  private async base64ToFile(base64: string, fileName: string): Promise<File> {
    const response = await fetch(base64);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
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
    
    // ✅ Detectar si es FormData
    const isFormData = body instanceof FormData;
    let serializedBody = body;
    let formDataFields;

    if (isFormData) {
      formDataFields = await this.serializeFormData(body);
      serializedBody = null; // No guardamos FormData directamente
    }

    const request: PendingRequest = {
      id,
      method,
      url,
      body: serializedBody,
      headers,
      timestamp: Date.now(),
      retries: 0,
      isFormData,
      formDataFields
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const addRequest = store.add(request);

      addRequest.onsuccess = () => {
        //console.log('💾 Acción guardada - Se sincronizará automáticamente:', method, url);
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

  // Sincronizar todas las peticiones pendientes automáticamente
  async syncPendingRequests(): Promise<void> {
    if (!this.isOnline() || this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    const pendingRequests = await this.getPendingRequests();
    
    if (pendingRequests.length === 0) {
      this.isSyncing = false;
      return;
    }

    //console.log(`🔄 Sincronizando ${pendingRequests.length} acción(es) automáticamente...`);
    
    let successCount = 0;
    let failCount = 0;

    for (const request of pendingRequests) {
      try {
        await this.executeRequest(request);
        await this.deletePendingRequest(request.id);
        successCount++;
        //console.log(`✅ Sincronizada: ${request.method} ${request.url}`);
      } catch (error) {
        //console.error('❌ Error al sincronizar:', error);
        failCount++;
        
        // ✅ Al primer intento fallido, eliminar inmediatamente
        await this.deletePendingRequest(request.id);
        //console.warn('⚠️ Petición eliminada por error en sincronización');
      }
    }

    this.isSyncing = false;

    // Mostrar mensaje según resultado
    if (failCount > 0) {
      //console.error(`❌ No se pudieron sincronizar ${failCount} acción(es). Peticiones eliminadas.`);
      alert(`No se pudieron sincronizar ${failCount} acción(es). Por favor, intenta nuevamente.`);
    }

    // Recargar la página solo si se sincronizaron datos exitosamente
    if (successCount > 0) {
      //console.log(`✅ ${successCount} acción(es) sincronizada(s) correctamente`);
      window.location.reload();
    }
  }

  // Ejecutar una petición HTTP
  private async executeRequest(request: PendingRequest): Promise<any> {
    const headers = new HttpHeaders(request.headers || {});
    let body = request.body;

    // ✅ Reconstruir FormData si es necesario
    if (request.isFormData && request.formDataFields) {
      body = await this.reconstructFormData(request.formDataFields);
    }

    switch (request.method) {
      case 'POST':
        return this.http.post(request.url, body, { headers }).toPromise();
      case 'PUT':
        return this.http.put(request.url, body, { headers }).toPromise();
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
          return from(this.savePendingRequest('POST', url, body, headers)).pipe(
            switchMap(() => of({ offline: true, message: 'Acción guardada, se sincronizará automáticamente' }))
          );
        })
      );
    } else {
      return from(this.savePendingRequest('POST', url, body, headers)).pipe(
        switchMap(() => of({ offline: true, message: 'Sin conexión - Se sincronizará automáticamente al reconectar' }))
      );
    }
  }

  // Wrapper para PUT con soporte offline
  putWithOfflineSupport(url: string, body: any, headers?: any): Observable<any> {
    if (this.isOnline()) {
      return this.http.put(url, body, { headers }).pipe(
        catchError(error => {
          return from(this.savePendingRequest('PUT', url, body, headers)).pipe(
            switchMap(() => of({ offline: true, message: 'Acción guardada, se sincronizará automáticamente' }))
          );
        })
      );
    } else {
      return from(this.savePendingRequest('PUT', url, body, headers)).pipe(
        switchMap(() => of({ offline: true, message: 'Sin conexión - Se sincronizará automáticamente al reconectar' }))
      );
    }
  }

  // Wrapper para DELETE con soporte offline
  deleteWithOfflineSupport(url: string, headers?: any): Observable<any> {
    if (this.isOnline()) {
      return this.http.delete(url, { headers }).pipe(
        catchError(error => {
          return from(this.savePendingRequest('DELETE', url, undefined, headers)).pipe(
            switchMap(() => of({ offline: true, message: 'Acción guardada, se sincronizará automáticamente' }))
          );
        })
      );
    } else {
      return from(this.savePendingRequest('DELETE', url, undefined, headers)).pipe(
        switchMap(() => of({ offline: true, message: 'Sin conexión - Se sincronizará automáticamente al reconectar' }))
      );
    }
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