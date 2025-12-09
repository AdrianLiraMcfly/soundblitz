import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiServices } from '../shared/services/api-services';
import { NavbarComponent } from '../shared/components/navbar-component/navbar-component';

interface Cancion {
  id: any;
  nombre: string;
  artista_id: any;
  artistaNombre?: string;
  album_id: any;
  albumNombre?: string;
  url_cancion: string;
  url_portada: string;
  duracion?: string;
  activo?: number;
}

interface Artista {
  id: any;
  nombre: string;
  imagen?: string;
  url_imagen?: string;
}

interface Album {
  id: any;
  nombre: string;
  artista_id: any;
  artistaNombre?: string;
  anio?: string;
  genero?: string;
  url_portada?: string;
}

@Component({
  selector: 'app-lista-canciones',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './lista-canciones-component.html',
  styleUrl: './lista-canciones-component.css'
})
export class ListaCancionesComponent implements OnInit {
  // Tipo de vista: 'artista' o 'album'
  tipoVista: 'artista' | 'album' = 'artista';
  
  // Datos cargados
  canciones: Cancion[] = [];
  artista: Artista | null = null;
  album: Album | null = null;
  
  // Estados
  loading: boolean = true;
  error: string = '';
  
  // ID del artista o álbum
  entityId: any;
  
  // Canción seleccionada para reproducir
  cancionActual: Cancion | null = null;
  isPlaying: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiServices: ApiServices
  ) {}

ngOnInit(): void {
  this.route.params.subscribe(params => {
    // Determinar el tipo de vista según la ruta
    if (this.router.url.includes('/artista/')) {
      this.tipoVista = 'artista';
      this.entityId = params['id'];
      this.cargarDatosArtista();
    } else if (this.router.url.includes('/album/')) {
      this.tipoVista = 'album';
      this.entityId = params['id'];
      this.cargarDatosAlbum();
    } else if (this.router.url.includes('/cancion/')) {
      // ✅ Manejar vista de canción individual
      this.entityId = params['id'];
      this.cargarCancionIndividual();
    }
  });
}

private cargarCancionIndividual(): void {
  this.loading = true;
  this.error = '';
  
  this.apiServices.getCanciones().subscribe({
    next: (response) => {
      const todasCanciones = response.data || response || [];
      const cancion = todasCanciones.find((c: any) => c.id == this.entityId);
      
      if (!cancion) {
        this.error = 'Canción no encontrada';
        this.loading = false;
        return;
      }
      
      // Cargar el artista de la canción
      this.apiServices.getArtistas().subscribe({
        next: (response) => {
          const artistas = response.data || response || [];
          const artista = artistas.find((a: any) => a.id == cancion.artista_id);
          
          if (artista) {
            // Redirigir a la vista del artista en lugar de mostrar solo la canción
            this.router.navigate(['/artista', artista.id]);
          } else {
            this.error = 'No se pudo cargar la información del artista';
            this.loading = false;
          }
        },
        error: () => {
          this.error = 'Error al cargar información del artista';
          this.loading = false;
        }
      });
    },
    error: () => {
      this.error = 'Error al cargar la canción';
      this.loading = false;
    }
  });
}

  // Cargar datos del artista y sus canciones
  cargarDatosArtista(): void {
    this.loading = true;
    this.error = '';
    
    Promise.all([
      this.obtenerArtista(),
      this.obtenerCancionesArtista()
    ]).then(() => {
      this.loading = false;
    }).catch(error => {
      //console.error('Error al cargar datos del artista:', error);
      this.error = 'Error al cargar la información del artista';
      this.loading = false;
    });
  }

  // Cargar datos del álbum y sus canciones
  cargarDatosAlbum(): void {
    this.loading = true;
    this.error = '';
    
    Promise.all([
      this.obtenerAlbum(),
      this.obtenerCancionesAlbum()
    ]).then(() => {
      this.loading = false;
    }).catch(error => {
      //console.error('Error al cargar datos del álbum:', error);
      this.error = 'Error al cargar la información del álbum';
      this.loading = false;
    });
  }

  // Obtener información del artista
  private obtenerArtista(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiServices.getArtistas().subscribe({
        next: (response) => {
          const artistas = response.data || response || [];
          this.artista = artistas.find((a: any) => a.id == this.entityId);
          
          if (!this.artista) {
            this.error = 'Artista no encontrado';
            reject(new Error('Artista no encontrado'));
          } else {
            resolve();
          }
        },
        error: (error) => {
          //console.error('Error al obtener artista:', error);
          reject(error);
        }
      });
    });
  }

  // Obtener canciones del artista
  private obtenerCancionesArtista(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiServices.getCanciones().subscribe({
        next: (response) => {
          const todasCanciones = response.data || response || [];
          
          // Filtrar por artista_id
          this.canciones = todasCanciones.filter((c: any) => c.artista_id == this.entityId);
          
          // Enriquecer con datos de artistas y álbumes
          this.enriquecerCanciones();
          
          //console.log(`✅ ${this.canciones.length} canciones del artista cargadas`);
          resolve();
        },
        error: (error) => {
          //console.error('Error al obtener canciones:', error);
          reject(error);
        }
      });
    });
  }

  // Obtener información del álbum
  private obtenerAlbum(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiServices.getAlbumes().subscribe({
        next: (response) => {
          const albumes = response.data || response || [];
          this.album = albumes.find((a: any) => a.id == this.entityId);
          
          if (!this.album) {
            this.error = 'Álbum no encontrado';
            reject(new Error('Álbum no encontrado'));
          } else {
            // Obtener nombre del artista del álbum
            this.apiServices.getArtistas().subscribe({
              next: (response) => {
                const artistas = response.data || response || [];
                const artista = artistas.find((a: any) => a.id == this.album?.artista_id);
                if (this.album && artista) {
                  this.album.artistaNombre = artista.nombre;
                }
                resolve();
              },
              error: () => resolve() // Continuar aunque falle
            });
          }
        },
        error: (error) => {
          //console.error('Error al obtener álbum:', error);
          reject(error);
        }
      });
    });
  }

  // Obtener canciones del álbum
  private obtenerCancionesAlbum(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiServices.getCanciones().subscribe({
        next: (response) => {
          const todasCanciones = response.data || response || [];
          
          // Filtrar por album_id
          this.canciones = todasCanciones.filter((c: any) => c.album_id == this.entityId);
          
          // Enriquecer con datos
          this.enriquecerCanciones();
          
          //console.log(`✅ ${this.canciones.length} canciones del álbum cargadas`);
          resolve();
        },
        error: (error) => {
          //console.error('Error al obtener canciones:', error);
          reject(error);
        }
      });
    });
  }

  // Enriquecer canciones con nombres de artistas y álbumes
  private enriquecerCanciones(): void {
    Promise.all([
      new Promise<any[]>(resolve => {
        this.apiServices.getArtistas().subscribe({
          next: (response) => resolve(response.data || response || []),
          error: () => resolve([])
        });
      }),
      new Promise<any[]>(resolve => {
        this.apiServices.getAlbumes().subscribe({
          next: (response) => resolve(response.data || response || []),
          error: () => resolve([])
        });
      })
    ]).then(([artistas, albumes]) => {
      this.canciones.forEach(cancion => {
        const artista = artistas.find((a: any) => a.id == cancion.artista_id);
        const album = albumes.find((a: any) => a.id == cancion.album_id);
        
        cancion.artistaNombre = artista?.nombre || 'Desconocido';
        cancion.albumNombre = album?.nombre || '';
      });
    });
  }

  // Reproducir canción
  reproducirCancion(cancion: Cancion): void {
    this.cancionActual = cancion;
    this.isPlaying = true;
    //console.log('🎵 Reproduciendo:', cancion.nombre);
    // Aquí puedes implementar la lógica de reproducción real
  }

  // Pausar reproducción
  pausarCancion(): void {
    this.isPlaying = false;
  }

  // Agregar a favoritos
  agregarAFavoritos(cancion: Cancion): void {
    //console.log('❤️ Agregando a favoritos:', cancion.nombre);
    // Implementar lógica de favoritos
  }

  // Agregar a playlist
  agregarAPlaylist(cancion: Cancion): void {
    //console.log('📋 Agregando a playlist:', cancion.nombre);
    // Implementar lógica de playlist
  }

  // Volver atrás
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // Formatear duración
  formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Obtener iniciales
  getInitials(nombre: string): string {
    if (!nombre) return '?';
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  }

  // ✅ MÉTODO PARA LIMPIAR URLs Y ELIMINAR "undefined"
  private limpiarUrl(url: string | undefined): string {
    if (!url || url === 'undefined' || url === 'null') {
      return '';
    }
    
    // Convertir a string y limpiar
    let urlLimpia = String(url).trim();
    
    // Eliminar todas las ocurrencias de "undefined" de la URL
    urlLimpia = urlLimpia.replace(/\/?undefined\/?/g, '/');
    
    // Eliminar barras duplicadas (excepto después de http://)
    urlLimpia = urlLimpia.replace(/([^:]\/)\/+/g, '$1');
    
    // Eliminar barra final si existe
    urlLimpia = urlLimpia.replace(/\/+$/, '');
    
    // Si la URL es relativa, construir la URL completa
    if (!urlLimpia.startsWith('http://') && !urlLimpia.startsWith('https://')) {
      // Si empieza con /, quitarla
      if (urlLimpia.startsWith('/')) {
        urlLimpia = urlLimpia.substring(1);
      }
      urlLimpia = `http://localhost:8085/files/${urlLimpia}`;
    }
    
    //console.log('🔧 URL limpiada:', urlLimpia);
    return urlLimpia;
  }


  getAlbumPortada(): string {
    // Si el álbum tiene portada propia, usarla
    
    
    // Si no, buscar la primera canción que tenga portada
    const cancionConPortada = this.canciones.find(c => c.url_portada);
    if (cancionConPortada?.url_portada) {
      const urlLimpia = this.limpiarUrl(cancionConPortada.url_portada);
      if (urlLimpia) return urlLimpia;
    }
    
    // Si no hay ninguna, devolver vacío para mostrar SVG predeterminado
    return '';
  }

  // ✅ MÉTODO PARA OBTENER PORTADA DEL ARTISTA (actualizado)
  getArtistaImagen(): string {
    if (this.artista?.url_imagen) {
      const urlLimpia = this.limpiarUrl(this.artista.url_imagen);
      if (urlLimpia) return urlLimpia;
    }
    
    // Buscar en las canciones del artista
    const cancionConPortada = this.canciones.find(c => c.url_portada);
    if (cancionConPortada?.url_portada) {
      const urlLimpia = this.limpiarUrl(cancionConPortada.url_portada);
      if (urlLimpia) return urlLimpia;
    }
    
    return '';
  }
}