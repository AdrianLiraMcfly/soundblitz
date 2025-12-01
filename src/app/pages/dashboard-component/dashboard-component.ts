import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiServices } from '../shared/services/api-services';
import { PlayerService } from '../shared/services/playing-service';
import { NavbarComponent } from '../shared/components/navbar-component/navbar-component';
import { PwaService } from '../shared/services/pwa-service';

@Component({
  selector: 'app-dashboard-component',
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css'
})
export class DashboardComponent implements OnInit {
  @ViewChild('qrVideo') qrVideo!: ElementRef<HTMLVideoElement>;

  // User properties
  currentUser: any = null;

  // Data from DB
  artistas: any[] = [];
  albumes: any[] = [];
  canciones: any[] = [];
  cancionesFavoritas: any[] = [];
  favoritasIds: Set<number> = new Set();
  loading: boolean = true;

  // QR Scanner
  showQRScanner: boolean = false;
  qrScanning: boolean = false;
  showQRSuccess: boolean = false;
  scannedSong: any = null;
    isOnline: boolean = true;
  
  constructor(private pwaService: PwaService, private router: Router,
    private apiServices: ApiServices,
    private playerService: PlayerService) {
    this.isOnline = this.pwaService.isOnline();
    
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
  }


  ngOnInit(): void {
    console.log('🚀 Dashboard inicializado');
    this.loadUserData();
    this.loadAllData();
    this.loadFavoritas();
  }

private loadUserData(): void {
  const token = localStorage.getItem('authToken');
  console.log('🔍 Token encontrado:', token ? 'Sí' : 'No');

  // ✅ Obtener datos del usuario usando el endpoint /me
  this.apiServices.me().subscribe({
    next: (response) => {
      console.log('📦 Respuesta del endpoint /me:', response);
      
      // Asignar datos del usuario
      this.currentUser = response.data || response.usuario || response;
      
      console.log('✅ Usuario cargado desde token:', {
        id: this.currentUser?.id,
        nombre: this.currentUser?.nombre,
        email: this.currentUser?.email,
        rol_id: this.currentUser?.rol_id
      });
      
      // ✅ Verificar que tenga ID
      if (!this.currentUser?.id) {
        console.error('⚠️ El usuario no tiene ID:', this.currentUser);
        this.currentUser = null;
        alert('Error al obtener datos de usuario');
        this.router.navigate(['/login']);
        return;
      }

      // ✅ Cargar favoritas DESPUÉS de confirmar que hay usuario
      console.log('👤 Usuario válido detectado, cargando favoritas...');
      this.loadFavoritas();
    },
    error: (error) => {
      console.error('❌ Error al obtener datos del usuario:', error);
      console.error('   Status:', error.status);
      console.error('   Mensaje:', error.error?.message || error.message);
  }});
}

  // Cargar todos los datos de la BD
  private loadAllData(): void {
    this.loading = true;

    Promise.all([
      this.loadArtistas(),
      this.loadAlbumes(),
      this.loadCanciones()
    ]).then(() => {
      this.loading = false;
      this.enrichData();
      console.log('✅ Todos los datos cargados');
    }).catch(error => {
      console.error('❌ Error al cargar datos:', error);
      this.loading = false;
    });
  }

  private loadArtistas(): Promise<void> {
    return new Promise((resolve) => {
      this.apiServices.getArtistas().subscribe({
        next: (response) => {
          this.artistas = response.data || response || [];
          console.log(`📊 ${this.artistas.length} artistas cargados`);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar artistas:', error);
          resolve();
        }
      });
    });
  }

  private loadAlbumes(): Promise<void> {
    return new Promise((resolve) => {
      this.apiServices.getAlbumes().subscribe({
        next: (response) => {
          this.albumes = response.data || response || [];
          console.log(`📀 ${this.albumes.length} álbumes cargados`);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar álbumes:', error);
          resolve();
        }
      });
    });
  }

  private loadCanciones(): Promise<void> {
    return new Promise((resolve) => {
      this.apiServices.getCanciones().subscribe({
        next: (response) => {
          this.canciones = response.data || response || [];
          console.log(`🎵 ${this.canciones.length} canciones cargadas`);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar canciones:', error);
          resolve();
        }
      });
    });
  }

  portadaALbum(album: any): string {
    for (let cancion of this.canciones) {
      if (cancion.album_id === album.id && cancion.url_portada) {
        return cancion.url_portada;
      }
    }
    return ''; // Retornar cadena vacía si no se encuentra portada
  }

  // Enriquecer datos con nombres de artistas
  private enrichData(): void {
    // Enriquecer álbumes con nombre de artista
    this.albumes.forEach(album => {
      const artista = this.artistas.find(a => a.id == album.artista_id);
      album.artistaNombre = artista?.nombre || 'Desconocido';
    });

    // Enriquecer canciones con nombre de artista y álbum
    this.canciones.forEach(cancion => {
      const artista = this.artistas.find(a => a.id == cancion.artista_id);
      const album = this.albumes.find(a => a.id == cancion.album_id);
      cancion.artistaNombre = artista?.nombre || 'Desconocido';
      cancion.albumNombre = album?.nombre || '';
    });
  }

  // Navegación
  navigateToArtista(id: any): void {
    this.router.navigate(['/artista', id]);
  }

  navigateToAlbum(id: any): void {
    this.router.navigate(['/album', id]);
  }
  goFavorites(): void {
    this.router.navigate(['/favoritas']);
  }

private getAudioUrl(cancion: any): string {
  console.log('🔍 DEBUG getAudioUrl:', {
    cancion_completa: cancion,
    url_cancion_raw: cancion.url_cancion,
    tipo: typeof cancion.url_cancion
  });

  if (!cancion.url_cancion || cancion.url_cancion === 'undefined' || cancion.url_cancion === 'null') {
    console.warn('⚠️ Sin URL de audio para:', cancion.nombre);
    return '';
  }
  
  // ✅ Convertir a string y limpiar
  let url = String(cancion.url_cancion).trim();
  
  console.log('📝 URL limpia:', url);

  // Si ya es URL completa
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('✅ URL completa detectada');
    return url;
  }
  
  // ✅ IMPORTANTE: Si empieza con /, quitarlo
  if (url.startsWith('/')) {
    url = url.substring(1); // Quitar el primer "/"
  }
  
  // ✅ Construir URL SIN barras duplicadas
  const urlFinal = `http://localhost:8085/files/${url}`;
  if (urlFinal.includes('undefined')) {
    // Quitar cualquier segmento "undefined" y normalizar barras
    let cleaned = urlFinal.replace(/\/?undefined\/?/g, '/');
    // Evitar dobles slashes excepto el "http(s)://"
    cleaned = cleaned.replace(/([^:]\/)\/+/g, '$1');
    // Quitar slash final sobrante
    cleaned = cleaned.replace(/\/+$/, '');
    console.log('🛠️ URL corregida eliminando "undefined":', cleaned);
    return cleaned;
  }
  
  console.log('🎯 URL final construida:', urlFinal);
  
  return urlFinal;
}

// Modificar el método reproducirCancion:
reproducirCancion(cancion: any): void {
  console.log('🎵 Reproduciendo canción:', cancion.nombre);
  console.log('   url_cancion original:', cancion.url_cancion);
  console.log('   url_portada original:', cancion.url_portada);

  if (cancion.url_portada.includes('undefined')) {
    let cleaned = cancion.url_portada.replace(/\/?undefined\/?/g, '');
    cleaned = cleaned.replace(/([^:]\/)\/+/g, '$1');
    cleaned = cleaned.replace(/\/+$/, '');
    console.log('🛠️ Corrigiendo url_portada eliminando "undefined":', cleaned);
    cancion.url_portada = cleaned;
  }
  
  const audioUrl = this.getAudioUrl(cancion);
  
  if (!audioUrl) {
    console.error('❌ No se pudo obtener URL de audio');
    alert('Esta canción no tiene archivo de audio disponible');
    return;
  }
  
  this.playerService.playSong({
    id: cancion.id,
    nombre: cancion.nombre,
    artista_id: cancion.artista_id,
    artistaNombre: cancion.artistaNombre,
    album_id: cancion.album_id,
    albumNombre: cancion.albumNombre,
    url_cancion: audioUrl, // ✅ Usar URL completa
    url_portada: cancion.url_portada,
    duracion: cancion.duracion
  });
}
private loadFavoritas(): void {
  if (!this.currentUser?.id) {
    console.warn('⚠️ No hay usuario logueado para cargar favoritas');
    return;
  }

  // ✅ CORREGIDO: Sin pasar usuario_id, el token lo maneja
  this.apiServices.getFavoritas().subscribe({
    next: (response) => {
      this.cancionesFavoritas = response.data || response || [];
      
      // Crear Set de IDs para búsqueda rápida
      this.favoritasIds = new Set(
        this.cancionesFavoritas.map(f => f.cancion_id || f.id)
      );
      
      console.log('❤️ Favoritas cargadas:', this.cancionesFavoritas.length);
      console.log('   IDs:', Array.from(this.favoritasIds));
    },
    error: (error) => {
      console.error('❌ Error al cargar favoritas:', error);
    }
  });
}

agregarAFavoritos(cancion: any, event?: Event): void {
  if (event) {
    event.stopPropagation();
  }

  console.log('🔍 DEBUG agregarAFavoritos - currentUser completo:', this.currentUser);
  console.log('🔍 DEBUG agregarAFavoritos - currentUser.id:', this.currentUser?.id);
  console.log('🔍 DEBUG agregarAFavoritos - tipo de id:', typeof this.currentUser?.id);

  // ✅ Verificar que haya usuario logueado
  if (!this.currentUser) {
    console.error('❌ currentUser es null o undefined');
    alert('Debes iniciar sesión para agregar favoritos');
    this.router.navigate(['/login']);
    return;
  }

  if (!this.currentUser.id) {
    console.error('❌ currentUser.id es null o undefined');
    console.error('   currentUser completo:', this.currentUser);
    alert('Error: No se pudo obtener tu ID de usuario. Inicia sesión nuevamente.');
    localStorage.removeItem('user_data');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
    return;
  }

  console.log('👤 Usuario actual:', {
    id: this.currentUser.id,
    nombre: this.currentUser.nombre,
    email: this.currentUser.email,
    rol_id: this.currentUser.rol_id
  });

  const esFavorito = this.esFavorito(cancion.id);

  if (esFavorito) {
    // ✅ Encontrar el ID de la favorita para eliminar
    const favorita = this.cancionesFavoritas.find(
      f => (f.cancion_id || f.id) === cancion.id
    );
    
    if (!favorita) {
      console.error('❌ No se encontró la favorita en el array local');
      console.log('   cancionesFavoritas:', this.cancionesFavoritas);
      console.log('   Buscando cancion.id:', cancion.id);
      return;
    }

    console.log('💔 Eliminando favorita:', {
      id_favorita: favorita.id,
      cancion_id: cancion.id,
      usuario_id: this.currentUser.id
    });

    // ✅ Eliminar por ID de favorita
    this.apiServices.eliminarFavorita(favorita.id).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del servidor (eliminar):', response);
        console.log('💔 Canción removida de favoritos:', cancion.nombre);
        
        // Actualizar localmente
        this.favoritasIds.delete(cancion.id);
        this.cancionesFavoritas = this.cancionesFavoritas.filter(
          f => f.id !== favorita.id
        );
        
        console.log('📊 Estado actualizado:', {
          total: this.cancionesFavoritas.length,
          ids: Array.from(this.favoritasIds)
        });
        
        this.mostrarNotificacion('Eliminado de favoritos', 'error');
      },
      error: (error) => {
        console.error('❌ Error al eliminar de favoritos:', error);
        console.error('   Status:', error.status);
        console.error('   Mensaje:', error.error?.message || error.message);
        alert('Error al eliminar de favoritos: ' + (error.error?.message || error.message));
      }
    });
  } else {
    console.log('❤️ Agregando a favoritos:', {
      usuario_id: this.currentUser.id,
      cancion_id: cancion.id,
      cancion_nombre: cancion.nombre
    });

    // ✅ Validar que los IDs sean números
    const usuarioId = Number(this.currentUser.id);
    const cancionId = Number(cancion.id);

    if (isNaN(usuarioId) || isNaN(cancionId)) {
      console.error('❌ IDs inválidos:', { usuarioId, cancionId });
      alert('Error: IDs inválidos');
      return;
    }

    console.log('📤 Enviando al backend:', {
      usuario_id: usuarioId,
      cancion_id: cancionId
    });

    // ✅ Agregar con usuario_id y cancion_id
    this.apiServices.agregarFavorita(usuarioId, cancionId).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del servidor (agregar):', response);
        console.log('❤️ Canción agregada a favoritos:', cancion.nombre);
        
        // Actualizar localmente con el ID devuelto
        const insertId = response.data?.insertId || response.data || response.insertId;
        
        console.log('🆔 ID de favorita devuelto:', insertId);
        
        const nuevaFavorita = {
          id: insertId,
          cancion_id: cancionId,
          usuario_id: usuarioId,
          activo: 1,
          ...cancion
        };
        
        console.log('📝 Nueva favorita creada:', nuevaFavorita);
        
        this.favoritasIds.add(cancionId);
        this.cancionesFavoritas.push(nuevaFavorita);
        
        console.log('📊 Estado actualizado:', {
          total: this.cancionesFavoritas.length,
          ids: Array.from(this.favoritasIds)
        });
        
        this.mostrarNotificacion('Agregado a favoritos', 'success');
      },
      error: (error) => {
        console.error('❌ Error al agregar a favoritos:', error);
        console.error('   Status:', error.status);
        console.error('   Mensaje:', error.error?.message || error.message);
        console.error('   Error completo:', error);
        
        if (error.status === 409 || error.status === 400) {
          alert('Esta canción ya está en tus favoritos');
        } else if (error.status === 401) {
          alert('No estás autenticado. Inicia sesión nuevamente.');
          this.router.navigate(['/login']);
        } else {
          alert('Error al agregar a favoritos: ' + (error.error?.message || error.message));
        }
      }
    });
  }
}

esFavorito(cancionId: any): boolean {
  const isFav = this.favoritasIds.has(Number(cancionId));
  return isFav;
}

  // ✅ OPCIONAL: Mostrar notificación temporal
  private notificacionVisible: boolean = false;
  private notificacionMensaje: string = '';
  private notificacionTipo: 'success' | 'error' = 'success';

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    this.notificacionMensaje = mensaje;
    this.notificacionTipo = tipo;
    this.notificacionVisible = true;

    setTimeout(() => {
      this.notificacionVisible = false;
    }, 3000);
  }

  // Getters para el template
  get notificacion() {
    return {
      visible: this.notificacionVisible,
      mensaje: this.notificacionMensaje,
      tipo: this.notificacionTipo
    };
  }

  // QR Scanner
  openQRScanner(): void {
    this.showQRScanner = true;
    // Implementar lógica del scanner
  }

  closeQRScanner(): void {
    this.showQRScanner = false;
    this.qrScanning = false;
  }

  switchCamera(): void {
    console.log('🔄 Cambiando cámara...');
    // Implementar cambio de cámara
  }

  // Utilidades
  getInitials(nombre: string): string {
    if (!nombre) return '?';
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
  }
}