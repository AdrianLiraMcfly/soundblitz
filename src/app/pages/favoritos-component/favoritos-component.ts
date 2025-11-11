import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, Route, RouterLink } from '@angular/router';
import { ApiServices } from '../shared/services/api-services';
import { AuthService } from '../shared/services/auth-service';
import { NavbarComponent } from '../shared/components/navbar-component/navbar-component';
import { Subscription } from 'rxjs';

interface Favorita {
  id: number;
  usuario_id: number;
  cancion_id: number;
  activo: number;
  created_at?: string;
  
  // Datos de la canción
  cancionNombre?: string;
  artistaNombre?: string;
  albumNombre?: string;
  url_cancion?: string;
  url_portada?: string;
  duracion?: string;
}

@Component({
  selector: 'app-favoritas',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, RouterLink],
  templateUrl: './favoritos-component.html',
  styleUrls: ['./favoritos-component.css']
})
export class FavoritasComponent implements OnInit, OnDestroy {
  // Datos
  favoritas: Favorita[] = [];
  favoritasFiltradas: Favorita[] = [];
  
  // Estados
  loading: boolean = false;
  error: string = '';
  successMessage: string = '';
  
  // Búsqueda y filtros
  searchQuery: string = '';
  sortBy: 'nombre' | 'artista' | 'fecha' = 'fecha';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Reproducción
  cancionActual: Favorita | null = null;
  isPlaying: boolean = false;
  audioElement: HTMLAudioElement | null = null;
  currentTime: number = 0;
  duration: number = 0;
  volume: number = 0.7;
  
  // Vista
  vistaActual: 'grid' | 'list' = 'grid';
  
  // Confirmación de eliminación
  favoritaAEliminar: Favorita | null = null;
  mostrarConfirmacion: boolean = false;
  
  private authSubscription?: Subscription;

  constructor(
    private apiServices: ApiServices,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.verificarAutenticacion();
    this.cargarFavoritas();
    this.cargarPreferencias();
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }

  // ===== AUTENTICACIÓN =====
  private verificarAutenticacion(): void {
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      if (!user) {
        console.warn('⚠️ Usuario no autenticado');
        this.router.navigate(['/login']);
      }
    });
  }

  // ===== CARGAR DATOS =====
  cargarFavoritas(): void {
    this.loading = true;
    this.error = '';

    console.log('📥 Cargando favoritas del usuario...');

    this.apiServices.getFavoritas().subscribe({
      next: (response) => {
        console.log('✅ Favoritas recibidas:', response);
        
        // Manejar diferentes estructuras de respuesta
        const datos = response.data || response;
        this.favoritas = Array.isArray(datos) ? datos : [];
        
        // Aplicar filtros y ordenamiento inicial
        this.aplicarFiltros();
        
        this.loading = false;
        console.log(`✅ ${this.favoritas.length} favoritas cargadas`);
      },
      error: (error) => {
        console.error('❌ Error al cargar favoritas:', error);
        this.loading = false;
        
        if (error.status === 401) {
          this.error = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else {
          this.error = error.error?.message || 'Error al cargar las canciones favoritas';
        }
      }
    });
  }

  // ===== BÚSQUEDA Y FILTROS =====
  onBuscar(): void {
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let resultado = [...this.favoritas];

    // Filtrar por búsqueda
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      resultado = resultado.filter(fav => 
        fav.cancionNombre?.toLowerCase().includes(query) ||
        fav.artistaNombre?.toLowerCase().includes(query) ||
        fav.albumNombre?.toLowerCase().includes(query)
      );
    }

    // Ordenar
    resultado.sort((a, b) => {
      let comparacion = 0;
      
      switch (this.sortBy) {
        case 'nombre':
          comparacion = (a.cancionNombre || '').localeCompare(b.cancionNombre || '');
          break;
        case 'artista':
          comparacion = (a.artistaNombre || '').localeCompare(b.artistaNombre || '');
          break;
        case 'fecha':
          const fechaA = new Date(a.created_at || 0).getTime();
          const fechaB = new Date(b.created_at || 0).getTime();
          comparacion = fechaA - fechaB;
          break;
      }
      
      return this.sortOrder === 'asc' ? comparacion : -comparacion;
    });

    this.favoritasFiltradas = resultado;
  }

  cambiarOrden(campo: 'nombre' | 'artista' | 'fecha'): void {
    if (this.sortBy === campo) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = campo;
      this.sortOrder = 'asc';
    }
    this.aplicarFiltros();
    this.guardarPreferencias();
  }

  // ===== ELIMINAR FAVORITA =====
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

    const id = this.favoritaAEliminar.id;
    const nombre = this.favoritaAEliminar.cancionNombre;

    console.log(`🗑️ Eliminando favorita: ${nombre} (ID: ${id})`);

    this.apiServices.eliminarFavorita(id.toString()).subscribe({
      next: () => {
        console.log('✅ Favorita eliminada exitosamente');
        
        // Remover de la lista
        this.favoritas = this.favoritas.filter(f => f.id !== id);
        this.aplicarFiltros();
        
        // Si se estaba reproduciendo, detener
        if (this.cancionActual?.id === id) {
          this.detenerReproduccion();
        }
        
        this.successMessage = `"${nombre}" eliminada de favoritos`;
        setTimeout(() => this.successMessage = '', 3000);
        
        this.cancelarEliminar();
      },
      error: (error) => {
        console.error('❌ Error al eliminar favorita:', error);
        this.error = error.error?.message || 'Error al eliminar de favoritos';
        setTimeout(() => this.error = '', 5000);
        this.cancelarEliminar();
      }
    });
  }

  // ===== REPRODUCCIÓN =====
  reproducir(favorita: Favorita): void {
    if (!favorita.url_cancion) {
      this.error = 'Esta canción no tiene archivo de audio';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    // Si es la misma canción, pausar/reanudar
    if (this.cancionActual?.id === favorita.id && this.audioElement) {
      if (this.isPlaying) {
        this.pausar();
      } else {
        this.reanudar();
      }
      return;
    }

    // Detener canción actual si existe
    if (this.audioElement) {
      this.audioElement.pause();
    }

    // Crear nuevo elemento de audio
    const urlCompleta = `http://localhost:8085/files${favorita.url_cancion}`;
    console.log('🎵 Reproduciendo:', favorita.cancionNombre, urlCompleta);

    this.audioElement = new Audio(urlCompleta);
    this.audioElement.volume = this.volume;
    
    // Eventos del audio
    this.audioElement.addEventListener('loadedmetadata', () => {
      this.duration = this.audioElement?.duration || 0;
    });

    this.audioElement.addEventListener('timeupdate', () => {
      this.currentTime = this.audioElement?.currentTime || 0;
    });

    this.audioElement.addEventListener('ended', () => {
      this.siguienteCancion();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.error('❌ Error al reproducir:', e);
      this.error = 'Error al reproducir la canción';
      setTimeout(() => this.error = '', 3000);
      this.isPlaying = false;
    });

    // Reproducir
    this.audioElement.play()
      .then(() => {
        this.cancionActual = favorita;
        this.isPlaying = true;
        
        // Registrar reproducción
        this.apiServices.registrarReproduccion(favorita.cancion_id.toString()).subscribe({
          next: () => console.log('✅ Reproducción registrada'),
          error: (err) => console.warn('⚠️ No se pudo registrar reproducción:', err)
        });
      })
      .catch(error => {
        console.error('❌ Error al iniciar reproducción:', error);
        this.error = 'No se pudo reproducir la canción';
        setTimeout(() => this.error = '', 3000);
      });
  }

  pausar(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
    }
  }

  reanudar(): void {
    if (this.audioElement) {
      this.audioElement.play();
      this.isPlaying = true;
    }
  }

  detenerReproduccion(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }
    this.cancionActual = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
  }

  siguienteCancion(): void {
    if (!this.cancionActual) return;
    
    const indiceActual = this.favoritasFiltradas.findIndex(f => f.id === this.cancionActual?.id);
    const siguienteIndice = (indiceActual + 1) % this.favoritasFiltradas.length;
    const siguiente = this.favoritasFiltradas[siguienteIndice];
    
    if (siguiente) {
      this.reproducir(siguiente);
    }
  }

  anteriorCancion(): void {
    if (!this.cancionActual) return;
    
    const indiceActual = this.favoritasFiltradas.findIndex(f => f.id === this.cancionActual?.id);
    const anteriorIndice = indiceActual === 0 ? this.favoritasFiltradas.length - 1 : indiceActual - 1;
    const anterior = this.favoritasFiltradas[anteriorIndice];
    
    if (anterior) {
      this.reproducir(anterior);
    }
  }

  cambiarTiempo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const tiempo = parseFloat(input.value);
    
    if (this.audioElement) {
      this.audioElement.currentTime = tiempo;
      this.currentTime = tiempo;
    }
  }

  cambiarVolumen(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.volume = parseFloat(input.value);
    
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    
    localStorage.setItem('volume', this.volume.toString());
  }

  toggleMute(): void {
    if (this.audioElement) {
      this.audioElement.muted = !this.audioElement.muted;
    }
  }

  // ===== VISTAS =====
  cambiarVista(vista: 'grid' | 'list'): void {
    this.vistaActual = vista;
    this.guardarPreferencias();
  }

  // ===== UTILIDADES =====
  formatearTiempo(segundos: number): string {
    if (isNaN(segundos)) return '0:00';
    
    const mins = Math.floor(segundos / 60);
    const secs = Math.floor(segundos % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getProgresoReproduccion(): number {
    if (!this.duration) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  // ===== PREFERENCIAS =====
  private guardarPreferencias(): void {
    const preferencias = {
      vista: this.vistaActual,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };
    localStorage.setItem('favoritasPreferencias', JSON.stringify(preferencias));
  }

  private cargarPreferencias(): void {
    const preferencias = localStorage.getItem('favoritasPreferencias');
    if (preferencias) {
      try {
        const prefs = JSON.parse(preferencias);
        this.vistaActual = prefs.vista || 'grid';
        this.sortBy = prefs.sortBy || 'fecha';
        this.sortOrder = prefs.sortOrder || 'desc';
      } catch (error) {
        console.warn('⚠️ Error al cargar preferencias:', error);
      }
    }
    
    // Cargar volumen
    const volumenGuardado = localStorage.getItem('volume');
    if (volumenGuardado) {
      this.volume = parseFloat(volumenGuardado);
    }
  }

  // ===== NAVEGACIÓN =====
  verCancion(favorita: Favorita): void {
    this.router.navigate(['/cancion', favorita.cancion_id]);
  }

  verArtista(favorita: Favorita): void {
    if (favorita.cancionNombre) {
      // Necesitarías el artista_id, lo dejamos comentado por ahora
      // this.router.navigate(['/artista', favorita.artistaId]);
    }
  }

  verAlbum(favorita: Favorita): void {
    if (favorita.albumNombre) {
      // Necesitarías el album_id, lo dejamos comentado por ahora
      // this.router.navigate(['/album', favorita.albumId]);
    }
  }
}