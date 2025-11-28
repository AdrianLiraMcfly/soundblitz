import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiServices } from '../shared/services/api-services';
import { PlayerService } from '../shared/services/playing-service';
import { NavbarComponent } from '../shared/components/navbar-component/navbar-component';
import { Subscription } from 'rxjs';

interface Favorita {
  // IDs
  favorita_id: number; // ✅ ID de la tabla favoritas
  id: number; // ✅ ID de la canción
  cancion_id: number;
  usuario_id: number;
  artista_id: number;
  album_id: number;
  
  // Nombres
  cancionNombre: string;
  artistaNombre: string;
  albumNombre?: string;
  
  // URLs
  url_cancion: string;
  url_portada: string;
  artista_url_imagen?: string;
  album_url_portada?: string;
  
  // Metadata
  duracion?: string;
  album_año?: number;
  fecha_agregado?: string;
  
  // Status
  activo: number;
  cancion_activo?: number;
}

@Component({
  selector: 'app-favoritas',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, RouterLink],
  templateUrl: './favoritos-component.html',
  styleUrls: ['./favoritos-component.css']
})
export class FavoritasComponent implements OnInit, OnDestroy {
  favoritas: Favorita[] = [];
  favoritasFiltradas: Favorita[] = [];
  
  // Reproducción
  cancionActual: Favorita | null = null;
  isPlaying: boolean = false;
  
  // Suscripciones al PlayerService
  private playerSubscription?: Subscription;
  private playingSubscription?: Subscription;
  
  // UI
  loading: boolean = false;
  error: string = '';
  successMessage: string = '';
  
  // Filtros y búsqueda
  searchQuery: string = '';
  sortBy: 'nombre' | 'artista' | 'fecha' = 'fecha';
  sortOrder: 'asc' | 'desc' = 'desc';
  vistaActual: 'grid' | 'list' = 'grid';
  
  // Eliminación
  mostrarConfirmacion: boolean = false;
  favoritaAEliminar: Favorita | null = null;

  constructor(
    private apiServices: ApiServices,
    private playerService: PlayerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarFavoritas();
    this.cargarPreferencias();
    this.suscribirseAlReproductor();
  }

  ngOnDestroy(): void {
    this.playerSubscription?.unsubscribe();
    this.playingSubscription?.unsubscribe();
  }

  // ✅ Suscribirse al PlayerService
  private suscribirseAlReproductor(): void {
    this.playerSubscription = this.playerService.currentSong$.subscribe(song => {
      if (song) {
        const favorita = this.favoritas.find(f => f.cancion_id === song.id);
        this.cancionActual = favorita || null;
      } else {
        this.cancionActual = null;
      }
    });

    this.playingSubscription = this.playerService.isPlaying$.subscribe(playing => {
      this.isPlaying = playing;
    });
  }

  // ===== CARGAR FAVORITAS =====
  
cargarFavoritas(): void {
  this.loading = true;
  this.error = '';

  this.apiServices.getFavoritas().subscribe({
    next: (response) => {
      console.log('📦 Favoritas recibidas:', response);
      console.log('📦 Primera favorita raw:', response.data?.[0]);
      
      const favoritasRaw = response.data || response || [];
      
      // ✅ Validar y mapear favoritas
      this.favoritas = favoritasRaw
        .filter((favorita: any) => {
          const valida = favorita && 
                        favorita.favorita_id && 
                        favorita.cancion_id && 
                        favorita.cancionNombre;
          
          if (!valida) {
            console.warn('⚠️ Favorita inválida descartada:', favorita);
          }
          
          return valida;
        })
        .map((favorita: any, index: number) => {
          console.log(`🔍 Procesando favorita ${index + 1}:`, {
            nombre: favorita.cancionNombre,
            url_cancion_original: favorita.url_cancion,
            url_portada_original: favorita.url_portada,
            album_url_portada_original: favorita.album_url_portada
          });
          
          // ✅ Mapear con URLs procesadas
          const favoritaProcesada: Favorita = {
            // IDs
            favorita_id: favorita.favorita_id,
            id: favorita.cancion_id_real || favorita.cancion_id,
            cancion_id: favorita.cancion_id,
            usuario_id: favorita.usuario_id,
            artista_id: favorita.artista_id || 0,
            album_id: favorita.album_id || 0,
            
            // Nombres
            cancionNombre: favorita.cancionNombre || 'Sin título',
            artistaNombre: favorita.artistaNombre || 'Artista desconocido',
            albumNombre: favorita.albumNombre || undefined,
            
            // URLs procesadas - ✅ IMPORTANTE: Procesar todas las URLs
            url_cancion: this.construirUrlCompleta(favorita.url_cancion || ''),
            url_portada: this.construirUrlCompleta(
              favorita.url_portada || 
              favorita.album_url_portada || 
              ''
            ),
            artista_url_imagen: favorita.artista_url_imagen 
              ? this.construirUrlCompleta(favorita.artista_url_imagen) 
              : undefined,
            album_url_portada: favorita.album_url_portada 
              ? this.construirUrlCompleta(favorita.album_url_portada) 
              : undefined,
            
            // Metadata
            duracion: favorita.duracion || undefined,
            album_año: favorita.album_año || undefined,
            fecha_agregado: favorita.fecha_agregado || undefined,
            
            // Status
            activo: favorita.favorita_activo ?? 1,
            cancion_activo: favorita.cancion_activo ?? 1
          };
          
          console.log(`✅ Favorita procesada ${index + 1}:`, {
            nombre: favoritaProcesada.cancionNombre,
            url_cancion: favoritaProcesada.url_cancion,
            url_portada: favoritaProcesada.url_portada,
            album_url_portada: favoritaProcesada.album_url_portada
          });
          
          return favoritaProcesada;
        });
      
      this.favoritasFiltradas = [...this.favoritas];
      this.aplicarOrdenamiento();
      
      console.log(`✅ ${this.favoritas.length} favoritas cargadas y procesadas`);
      console.log('📊 Favoritas finales:', this.favoritas);
      
      this.loading = false;
    },
    error: (error) => {
      console.error('❌ Error completo:', error);
      console.error('   Status:', error.status);
      console.error('   Mensaje:', error.error?.message || error.message);
      
      this.error = error.error?.message || 'Error al cargar favoritas';
      this.loading = false;
      
      if (error.status === 401) {
        console.error('⚠️ Token inválido o expirado');
        alert('Tu sesión ha expirado. Inicia sesión nuevamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        this.router.navigate(['/login']);
      }
    }
  });
}

// ✅ Método para construir URLs completas
private construirUrlCompleta(url: string): string {
  if (!url || url === 'undefined' || url === 'null' || url.trim() === '') {
    console.warn('⚠️ URL vacía o inválida:', url);
    return '';
  }

  // Convertir a string y limpiar
  url = String(url).trim();

  // ✅ Si ya es una URL completa (HTTP o HTTPS), devolverla tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('✅ URL externa completa detectada:', url);
    return url;
  }

  // ✅ Si es una URL de CDN de Deezer sin protocolo, agregar https
  if (url.startsWith('//cdn-images.dzcdn.net') || url.includes('dzcdn.net')) {
    const urlCompleta = url.startsWith('//') ? `https:${url}` : `https://${url}`;
    console.log('✅ URL de CDN Deezer procesada:', urlCompleta);
    return urlCompleta;
  }

  // ✅ Si empieza con //, agregar https
  if (url.startsWith('//')) {
    const urlCompleta = `https:${url}`;
    console.log('✅ URL con protocolo relativo procesada:', urlCompleta);
    return urlCompleta;
  }

  // Para URLs locales (archivos subidos)
  // Quitar barra inicial si existe
  if (url.startsWith('/')) {
    url = url.substring(1);
  }

  // Construir URL local
  const urlFinal = `http://localhost:8085/files/${url}`;

  // Limpiar "undefined" si existe
  if (urlFinal.includes('undefined')) {
    let cleaned = urlFinal.replace(/\/?undefined\/?/g, '/');
    cleaned = cleaned.replace(/([^:]\/)\/+/g, '$1');
    cleaned = cleaned.replace(/\/+$/, '');
    console.log('🔧 URL local limpiada:', cleaned);
    return cleaned;
  }

  console.log('🔗 URL local construida:', urlFinal);
  return urlFinal;
}

handleImageError(event: Event): void {
  const imgElement = event.target as HTMLImageElement;
  const originalSrc = imgElement.src;
  
  console.warn('⚠️ Error al cargar imagen:', originalSrc);
  
  // Fallback a imagen de placeholder
  imgElement.src = 'https://via.placeholder.com/300x300/1f2937/6b7280?text=Sin+Portada';
  imgElement.onerror = null; // Prevenir loop infinito
}

  // ===== REPRODUCCIÓN =====
  
reproducir(favorita: Favorita): void {
  if (!favorita.url_cancion) {
    this.mostrarError('Esta canción no tiene archivo de audio');
    return;
  }

  console.log('🎵 Reproducir favorita:', {
    favorita_id: favorita.favorita_id,
    cancion_id: favorita.cancion_id,
    id: favorita.id,
    nombre: favorita.cancionNombre,
    artista: favorita.artistaNombre,
    album: favorita.albumNombre,
    url_cancion: favorita.url_cancion,
    url_portada: favorita.url_portada
  });

  // ✅ Enviar al PlayerService con todos los datos
  this.playerService.playSong({
    id: favorita.cancion_id, // ✅ Usar cancion_id
    nombre: favorita.cancionNombre || 'Sin título',
    artista_id: favorita.artista_id || 0,
    artistaNombre: favorita.artistaNombre || 'Artista desconocido',
    album_id: favorita.album_id || 0,
    albumNombre: favorita.albumNombre || '',
    url_cancion: favorita.url_cancion,
    url_portada: favorita.url_portada || favorita.album_url_portada || '',
    duracion: favorita.duracion
  });
  
  // Registrar reproducción
  this.apiServices.registrarReproduccion(favorita.cancion_id.toString()).subscribe({
    next: () => console.log('✅ Reproducción registrada'),
    error: (err) => console.warn('⚠️ No se pudo registrar reproducción:', err)
  });
}

  pausar(): void {
    this.playerService.pause();
  }

  reanudar(): void {
    this.playerService.play();
  }

  detenerReproduccion(): void {
    this.playerService.pause();
  }

  siguienteCancion(): void {
    if (!this.cancionActual) return;
    
    const indiceActual = this.favoritasFiltradas.findIndex(
      f => f.cancion_id === this.cancionActual?.cancion_id
    );
    
    if (indiceActual === -1) return;
    
    const siguienteIndice = (indiceActual + 1) % this.favoritasFiltradas.length;
    const siguiente = this.favoritasFiltradas[siguienteIndice];
    
    if (siguiente) {
      this.reproducir(siguiente);
    }
  }

  anteriorCancion(): void {
    if (!this.cancionActual) return;
    
    const indiceActual = this.favoritasFiltradas.findIndex(
      f => f.cancion_id === this.cancionActual?.cancion_id
    );
    
    if (indiceActual === -1) return;
    
    const anteriorIndice = indiceActual === 0 
      ? this.favoritasFiltradas.length - 1 
      : indiceActual - 1;
    const anterior = this.favoritasFiltradas[anteriorIndice];
    
    if (anterior) {
      this.reproducir(anterior);
    }
  }

  // ✅ Métodos para controlar el PlayerService
  cambiarTiempo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const tiempo = parseFloat(input.value);
    this.playerService.seek(tiempo);
  }

  cambiarVolumen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const volumen = parseFloat(input.value);
    this.playerService.setVolume(volumen);
  }

  toggleMute(): void {
    const volumenActual = this.playerService.getVolume();
    this.playerService.setVolume(volumenActual === 0 ? 0.7 : 0);
  }

  // ✅ Getters para obtener datos del PlayerService
  get currentTime(): number {
    return this.playerService.getCurrentTime();
  }

  get duration(): number {
    return this.playerService.getDuration();
  }

  get volume(): number {
    return this.playerService.getVolume();
  }

  getProgresoReproduccion(): number {
    if (!this.duration) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  formatearTiempo(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ===== BÚSQUEDA Y FILTROS =====
  
  onBuscar(): void {
    const query = this.searchQuery.toLowerCase().trim();
    
    if (!query) {
      this.favoritasFiltradas = [...this.favoritas];
    } else {
      this.favoritasFiltradas = this.favoritas.filter(f =>
        f.cancionNombre.toLowerCase().includes(query) ||
        f.artistaNombre.toLowerCase().includes(query) ||
        (f.albumNombre && f.albumNombre.toLowerCase().includes(query))
      );
    }
    
    this.aplicarOrdenamiento();
  }

  cambiarOrden(criterio: 'nombre' | 'artista' | 'fecha'): void {
    if (this.sortBy === criterio) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = criterio;
      this.sortOrder = 'asc';
    }
    
    this.aplicarOrdenamiento();
    this.guardarPreferencias();
  }

  private aplicarOrdenamiento(): void {
    this.favoritasFiltradas.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'nombre':
          comparison = a.cancionNombre.localeCompare(b.cancionNombre);
          break;
        case 'artista':
          comparison = a.artistaNombre.localeCompare(b.artistaNombre);
          break;
        case 'fecha':
          comparison = a.id - b.id;
          break;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  // ===== VISTAS =====
  
  cambiarVista(vista: 'grid' | 'list'): void {
    this.vistaActual = vista;
    this.guardarPreferencias();
  }

  // ===== ELIMINAR =====
  
  confirmarEliminar(favorita: Favorita): void {
    this.favoritaAEliminar = favorita;
    this.mostrarConfirmacion = true;
  }

  cancelarEliminar(): void {
    this.favoritaAEliminar = null;
    this.mostrarConfirmacion = false;
  }

eliminarFavorita(): void {
  if (!this.favoritaAEliminar) return;

  const id = this.favoritaAEliminar.favorita_id; // ✅ Usar favorita_id, NO cancion_id
  
  console.log('🗑️ Eliminando favorita:', {
    favorita_id: id,
    cancion_id: this.favoritaAEliminar.cancion_id,
    nombre: this.favoritaAEliminar.cancionNombre
  });
  
  this.apiServices.eliminarFavorita(id).subscribe({
    next: () => {
      console.log('✅ Favorita eliminada');
      
      // Si era la canción actual, pausar
      if (this.cancionActual?.cancion_id === this.favoritaAEliminar?.cancion_id) {
        this.detenerReproduccion();
      }
      
      // Actualizar lista (filtrar por favorita_id)
      this.favoritas = this.favoritas.filter(f => f.favorita_id !== id);
      this.onBuscar();
      
      this.mostrarExito('Canción eliminada de favoritos');
      this.mostrarConfirmacion = false;
      this.favoritaAEliminar = null;
    },
    error: (error) => {
      console.error('❌ Error al eliminar:', error);
      this.mostrarError(error.error?.message || 'Error al eliminar favorita');
      this.mostrarConfirmacion = false;
    }
  });
}

  // ===== PREFERENCIAS =====
  
  private cargarPreferencias(): void {
    const prefs = localStorage.getItem('favoritas_prefs');
    if (prefs) {
      try {
        const { vista, sortBy, sortOrder } = JSON.parse(prefs);
        this.vistaActual = vista || 'grid';
        this.sortBy = sortBy || 'fecha';
        this.sortOrder = sortOrder || 'desc';
      } catch (error) {
        console.warn('Error al cargar preferencias:', error);
      }
    }
  }

  private guardarPreferencias(): void {
    const prefs = {
      vista: this.vistaActual,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };
    localStorage.setItem('favoritas_prefs', JSON.stringify(prefs));
  }

  // ===== MENSAJES =====
  
  private mostrarError(mensaje: string): void {
    this.error = mensaje;
    setTimeout(() => this.error = '', 3000);
  }

  private mostrarExito(mensaje: string): void {
    this.successMessage = mensaje;
    setTimeout(() => this.successMessage = '', 3000);
  }
}