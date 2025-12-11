import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiServices } from '../../shared/services/api-services';
import { NavbarComponent } from '../../shared/components/navbar-component/navbar-component';

interface Cancion {
  id?: any;
  nombre: string;
  artista_id: any;
  artistaNombre?: string;
  album_id: any;
  albumNombre?: string;
  url_cancion: string;
  url_portada: string;
  activo?: number;
  fechaCreacion?: Date;
  duracion?: string;
  reproducciones?: number;
}

interface Artista {
  id: any;
  nombre: string;
}

interface Album {
  id: any;
  nombre: string;
  artista_id: any;
}

@Component({
  selector: 'app-crear-canciones-component',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './crear-canciones-component.html',
  styleUrl: './crear-canciones-component.css'
})
export class CrearCancionesComponent implements OnInit {
  canciones: Cancion[] = [];
  cancionesOriginales: Cancion[] = [];
  artistas: Artista[] = [];
  albumes: Album[] = [];
  albumesFiltrados: Album[] = [];
  
  nuevaCancion: Cancion = {
    nombre: '',
    artista_id: '',
    album_id: '',
    url_cancion: '',
    url_portada: '',
    activo: 1
  };
  
  // ✅ NUEVO: Variables para el archivo MP3
  archivoMP3: File | null = null;
  archivoMP3Nombre: string = '';
  subiendoArchivo: boolean = false;
  progresoCarga: number = 0;
  
  searchTerm: string = '';
  sortOrder: string = 'nombre-asc';
  
  busquedaDeezer: string = '';
  resultadosDeezer: any[] = [];
  buscandoDeezer: boolean = false;
  mostrarResultadosDeezer: boolean = false;
  
  totalCanciones: number = 0;
  nuevasEsteMes: number = 0;
  cancionMasPopular: string = '-';
  
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  loading: boolean = false;
  loadingInitial: boolean = true;
  error: string = '';
  successMessage: string = '';
  mostrarFormulario: boolean = false;

  Math = Math;

  constructor(private apiServices: ApiServices) {}

  ngOnInit(): void {
    this.loadingInitial = true;
    Promise.all([
      this.cargarArtistasPromise(),
      this.cargarAlbumesPromise()
    ]).then(() => {
      this.cargarCanciones();
    }).catch(() => {
      this.loadingInitial = false;
    });
  }

  private cargarArtistasPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiServices.getArtistas().subscribe({
        next: (response) => {
          this.artistas = response.data || response;
          resolve();
        },
        error: (error) => {
          //console.error('Error al cargar artistas:', error);
          reject(error);
        }
      });
    });
  }

  private cargarAlbumesPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiServices.getAlbumes().subscribe({
        next: (response) => {
          this.albumes = response.data || response;
          resolve();
        },
        error: (error) => {
          //console.error('Error al cargar álbumes:', error);
          reject(error);
        }
      });
    });
  }

  cargarArtistas(): void {
    this.apiServices.getArtistas().subscribe({
      next: (response) => {
        this.artistas = response.data || response;
      },
      error: (error) => {
        //console.error('Error al cargar artistas:', error);
      }
    });
  }

  cargarAlbumes(): void {
    this.apiServices.getAlbumes().subscribe({
      next: (response) => {
        this.albumes = response.data || response;
      },
      error: (error) => {
        //console.error('Error al cargar álbumes:', error);
      }
    });
  }

  onArtistaChange(): void {
    if (this.nuevaCancion.artista_id) {
      this.albumesFiltrados = this.albumes.filter(
        album => album.artista_id == this.nuevaCancion.artista_id
      );
      if (this.nuevaCancion.album_id) {
        const albumValido = this.albumesFiltrados.find(
          a => a.id == this.nuevaCancion.album_id
        );
        if (!albumValido) {
          this.nuevaCancion.album_id = '';
        }
      }
    } else {
      this.albumesFiltrados = [];
      this.nuevaCancion.album_id = '';
    }
  }

  // ✅ NUEVO: Manejar selección de archivo MP3
  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar que sea MP3
      if (!file.type.includes('audio/mpeg') && !file.name.endsWith('.mp3')) {
        this.error = 'Por favor selecciona un archivo MP3 válido';
        setTimeout(() => this.error = '', 3000);
        return;
      }

      // Validar tamaño (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.error = 'El archivo es muy grande. Máximo 10MB';
        setTimeout(() => this.error = '', 3000);
        return;
      }

      this.archivoMP3 = file;
      this.archivoMP3Nombre = file.name;
      
      // ✅ Obtener duración del audio
      this.obtenerDuracionAudio(file);
      
      //console.log('✅ Archivo MP3 seleccionado:', file.name, 'Tamaño:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    }
  }

  // ✅ NUEVO: Obtener duración del archivo de audio
  private obtenerDuracionAudio(file: File): void {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      const duracion = Math.floor(audio.duration);
      const minutos = Math.floor(duracion / 60);
      const segundos = duracion % 60;
      this.nuevaCancion.duracion = `${minutos}:${segundos.toString().padStart(2, '0')}`;
      //console.log('⏱️ Duración detectada:', this.nuevaCancion.duracion);
      URL.revokeObjectURL(url);
    });
    
    audio.src = url;
  }

  // ✅ NUEVO: Eliminar archivo seleccionado
  eliminarArchivoMP3(): void {
    this.archivoMP3 = null;
    this.archivoMP3Nombre = '';
    this.nuevaCancion.duracion = undefined;
    
    // Limpiar el input file
    const fileInput = document.getElementById('archivoMP3') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  buscarEnDeezer(): void {
    if (!this.busquedaDeezer.trim()) {
      this.error = 'Ingresa un término de búsqueda';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    this.buscandoDeezer = true;
    this.error = '';
    
    this.apiServices.buscarCancionDeezer(this.busquedaDeezer).subscribe({
      next: (response: any) => {
        const data = response.data || response;
        this.resultadosDeezer = Array.isArray(data) ? data : [];
        this.buscandoDeezer = false;
        this.mostrarResultadosDeezer = true;
        
        if (this.resultadosDeezer.length === 0) {
          this.error = 'No se encontraron resultados en Deezer';
          setTimeout(() => this.error = '', 3000);
        }
      },
      error: (error) => {
        //console.error('Error al buscar en Deezer:', error);
        this.error = 'Error al buscar en Deezer. Por favor, intenta de nuevo.';
        this.buscandoDeezer = false;
        this.resultadosDeezer = [];
        this.mostrarResultadosDeezer = false;
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

seleccionarCancionDeezer(track: any): void {
  // Solo llenar nombre y portada
  this.nuevaCancion.nombre = track.title || '';
  this.nuevaCancion.url_portada = track.album.cover_medium || track.album.cover_big || track.album.cover_xl || '';
  
  //console.log('✅ Datos importados de Deezer:');
  //console.log('   Nombre:', this.nuevaCancion.nombre);
  //console.log('   Portada:', this.nuevaCancion.url_portada);
  
  this.busquedaDeezer = '';
  this.resultadosDeezer = [];
  this.mostrarResultadosDeezer = false;
  
  this.successMessage = 'Nombre y portada importados desde Deezer. Ahora sube el archivo MP3.';
  setTimeout(() => {
    this.successMessage = '';
  }, 3000);
}
  cerrarResultadosDeezer(): void {
    this.mostrarResultadosDeezer = false;
    this.busquedaDeezer = '';
    this.resultadosDeezer = [];
  }

agregarCancion(event: Event): void {
  event.preventDefault();

  // Validar archivo MP3
  if (!this.archivoMP3) {
    this.error = 'Por favor selecciona un archivo MP3';
    setTimeout(() => this.error = '', 3000);
    return;
  }

  // Validaciones básicas
  if (!this.nuevaCancion.nombre.trim() || !this.nuevaCancion.artista_id) {
    this.error = 'Completa los campos obligatorios: nombre y artista';
    setTimeout(() => this.error = '', 3000);
    return;
  }

  this.loading = true;
  this.subiendoArchivo = true;
  this.progresoCarga = 0;
  this.error = '';
  this.successMessage = '';

  // ✅ CORREGIDO: Incluir TODOS los datos necesarios
  const cancionData = {
    nombre: this.nuevaCancion.nombre.trim(),
    artista_id: this.nuevaCancion.artista_id,
    album_id: this.nuevaCancion.album_id || null,
    url_cancion: '', // Se llenará en el backend con la ruta del archivo
    url_portada: this.nuevaCancion.url_portada?.trim() || '', // ✅ URL de Deezer
    activo: this.nuevaCancion.activo ?? 1,
    duracion: this.nuevaCancion.duracion || null // ✅ Duración detectada
  };

  // ✅ Crear FormData con los nombres EXACTOS que espera el backend
  const formData = new FormData();
  
  // 1. datos (JSON stringificado) - CON todos los campos
  formData.append('datos', JSON.stringify(cancionData));
  
  // 2. cancion (archivo MP3)
  formData.append('cancion', this.archivoMP3, this.archivoMP3.name);

  //console.log('📤 Enviando canción con archivo MP3');
  //console.log('📋 Datos completos:', cancionData);
  //console.log('🎵 Archivo MP3:', this.archivoMP3.name, `(${(this.archivoMP3.size / 1024 / 1024).toFixed(2)} MB)`);
  //console.log('🖼️ URL Portada:', cancionData.url_portada || 'No especificada');
  //console.log('⏱️ Duración:', cancionData.duracion || 'No detectada');

  // Simular progreso
  const interval = setInterval(() => {
    if (this.progresoCarga < 90) {
      this.progresoCarga += 10;
    }
  }, 200);
  this.apiServices.crearCancionFormData(formData).subscribe({
    next: (response) => {
      clearInterval(interval);
      this.progresoCarga = 100;
      
      //console.log('✅ Canción creada exitosamente:', response);
      this.successMessage = `Canción "${this.nuevaCancion.nombre}" agregada exitosamente`;

      setTimeout(() => {
        this.resetFormulario();
        this.cargarCanciones();
        this.mostrarFormulario = false;
        this.subiendoArchivo = false;
        this.progresoCarga = 0;
      }, 1500);

      this.loading = false;
      setTimeout(() => (this.successMessage = ''), 3000);
    },
    error: (error) => {
      clearInterval(interval);
      //console.error('❌ Error al agregar canción:', error);vkgfytytfiytfoutfoutfoftfo

      if (error.status === 500) {
        this.error = error.error?.message || 'Error del servidor. Verifica los logs del backend.';
      } else if (error.status === 400) {
        this.error = error.error?.message || 'Datos inválidos. Verifica los campos.';
      } else if (error.status === 413) {
        this.error = 'El archivo es muy grande. Reduce el tamaño del MP3.';
      } else {
        this.error = error.error?.message || 'Error al agregar la canción.';
      }

      this.loading = false;
      this.subiendoArchivo = false;
      this.progresoCarga = 0;
      setTimeout(() => (this.error = ''), 8000);
    },
  });
}
  cargarCanciones(): void {
    this.loading = true;
    this.error = '';
    
    this.apiServices.getCanciones().subscribe({
      next: (response) => {
        const cancionesData = response.data || response;
        
        if (!cancionesData || !Array.isArray(cancionesData)) {
          this.cancionesOriginales = [];
          this.canciones = [];
          this.totalCanciones = 0;
          this.loading = false;
          this.loadingInitial = false;
          return;
        }
        
        cancionesData.forEach((cancion: Cancion) => {
          const artista = this.artistas.find(a => a.id === cancion.artista_id);
          const album = this.albumes.find(a => a.id === cancion.album_id);
          cancion.artistaNombre = artista ? artista.nombre : 'Desconocido';
          cancion.albumNombre = album ? album.nombre : 'Sin álbum';
        });
        
        this.cancionesOriginales = [...cancionesData];
        this.totalCanciones = this.cancionesOriginales.length;
        this.calcularEstadisticas();
        this.aplicarFiltrosYOrdenamiento();
        this.loading = false;
        this.loadingInitial = false;
      },
      error: (error) => {
        //console.error('Error al cargar canciones:', error);
        this.error = 'Error al cargar las canciones. Por favor, intenta de nuevo.';
        this.loading = false;
        this.loadingInitial = false;
        this.cancionesOriginales = [];
        this.canciones = [];
        this.totalCanciones = 0;
      }
    });
  }

  editarCancion(cancion: Cancion): void {
    this.nuevaCancion = { ...cancion };
    this.onArtistaChange();
    this.mostrarFormulario = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  actualizarCancion(): void {
    if (!this.nuevaCancion.id) return;

    this.loading = true;
    
    const cancionData = {
      nombre: this.nuevaCancion.nombre.trim(),
      artista_id: this.nuevaCancion.artista_id,
      album_id: this.nuevaCancion.album_id || null,
      url_cancion: this.nuevaCancion.url_cancion.trim(),
      url_portada: this.nuevaCancion.url_portada.trim() || null,
      activo: this.nuevaCancion.activo
    };

    this.apiServices.actualizarCancion(this.nuevaCancion.id, cancionData).subscribe({
      next: (response) => {
        this.successMessage = 'Canción actualizada exitosamente';
        this.resetFormulario();
        this.cargarCanciones();
        this.mostrarFormulario = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        //console.error('Error al editar canción:', error);
        this.error = 'Error al editar la canción. Por favor, intenta de nuevo.';
        this.loading = false;
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  toggleEstadoCancion(cancion: Cancion): void {
    const nuevoEstado = cancion.activo === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';
    
    if (confirm(`¿Estás seguro de ${accion} la canción "${cancion.nombre}"?`)) {
      const cancionData = {
        nombre: cancion.nombre,
        artista_id: cancion.artista_id,
        album_id: cancion.album_id,
        url_cancion: cancion.url_cancion,
        url_portada: cancion.url_portada,
        activo: nuevoEstado
      };

      this.apiServices.actualizarCancion(cancion.id, cancionData).subscribe({
        next: (response) => {
          this.successMessage = `Canción "${cancion.nombre}" ${nuevoEstado === 1 ? 'activada' : 'desactivada'} exitosamente`;
          cancion.activo = nuevoEstado;
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          //console.error('Error al cambiar estado:', error);
          this.error = 'Error al cambiar el estado de la canción.';
          setTimeout(() => this.error = '', 3000);
        }
      });
    }
  }

  eliminarCancion(cancion: Cancion): void {
    if (confirm(`¿Estás seguro de eliminar la canción "${cancion.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      this.apiServices.eliminarCancion(cancion.id).subscribe({
        next: (response) => {
          this.successMessage = `Canción "${cancion.nombre}" eliminada exitosamente`;
          this.cancionesOriginales = this.cancionesOriginales.filter(c => c.id !== cancion.id);
          this.totalCanciones = this.cancionesOriginales.length;
          this.aplicarFiltrosYOrdenamiento();
          this.calcularEstadisticas();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          //console.error('Error al eliminar canción:', error);
          this.error = 'Error al eliminar la canción. Por favor, intenta de nuevo.';
          setTimeout(() => this.error = '', 3000);
        }
      });
    }
  }

  resetFormulario(): void {
    this.nuevaCancion = {
      nombre: '',
      artista_id: '',
      album_id: '',
      url_cancion: '',
      url_portada: '',
      activo: 1
    };
    this.albumesFiltrados = [];
    this.cerrarResultadosDeezer();
    this.eliminarArchivoMP3(); // ✅ Limpiar archivo
  }

  cancelarEdicion(): void {
    this.resetFormulario();
    this.mostrarFormulario = false;
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.resetFormulario();
    }
  }

  isActivo(cancion: Cancion): boolean {
    return cancion.activo === 1;
  }

  calcularEstadisticas(): void {
    if (this.cancionesOriginales.length === 0) {
      this.nuevasEsteMes = 0;
      this.cancionMasPopular = '-';
      return;
    }

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    this.nuevasEsteMes = this.cancionesOriginales.filter(cancion => {
      if (cancion.fechaCreacion) {
        const fecha = new Date(cancion.fechaCreacion);
        return fecha >= inicioMes;
      }
      return false;
    }).length;

    const masPopular = this.cancionesOriginales.reduce((prev, current) => 
      (current.reproducciones || 0) > (prev.reproducciones || 0) ? current : prev
    );
    this.cancionMasPopular = masPopular?.nombre || '-';
  }

  aplicarFiltrosYOrdenamiento(): void {
    let cancionesFiltradas = [...this.cancionesOriginales];

    if (this.searchTerm) {
      cancionesFiltradas = cancionesFiltradas.filter(cancion =>
        cancion.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        cancion.artistaNombre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        cancion.albumNombre?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    switch (this.sortOrder) {
      case 'nombre-asc':
        cancionesFiltradas.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'nombre-desc':
        cancionesFiltradas.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case 'artista':
        cancionesFiltradas.sort((a, b) => (a.artistaNombre || '').localeCompare(b.artistaNombre || ''));
        break;
      case 'album':
        cancionesFiltradas.sort((a, b) => (a.albumNombre || '').localeCompare(b.albumNombre || ''));
        break;
      case 'fecha':
        cancionesFiltradas.sort((a, b) => {
          const fechaA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
          const fechaB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
          return fechaB - fechaA;
        });
        break;
      case 'popular':
        cancionesFiltradas.sort((a, b) => (b.reproducciones || 0) - (a.reproducciones || 0));
        break;
    }

    this.canciones = cancionesFiltradas;
    this.totalPages = Math.ceil(this.canciones.length / this.itemsPerPage);
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  onSearch(): void {
    this.currentPage = 1;
    this.aplicarFiltrosYOrdenamiento();
  }

  onSortChange(): void {
    this.aplicarFiltrosYOrdenamiento();
  }

  get cancionesPaginadas(): Cancion[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.canciones.slice(startIndex, endIndex);
  }

  get hayDatos(): boolean {
    return this.cancionesOriginales.length > 0;
  }

  get hayResultadosFiltrados(): boolean {
    return this.canciones.length > 0;
  }

  get estaBuscando(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  getIniciales(nombre: string): string {
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  }

  getColorAvatar(index: number): string {
    const colores = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-rose-500'
    ];
    return colores[index % colores.length];
  }

  formatearFecha(fecha: Date | undefined): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPages) {
      this.currentPage = pagina;
    }
  }

  paginaAnterior(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  paginaSiguiente(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  get paginasVisibles(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5;
    let inicio = Math.max(1, this.currentPage - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.totalPages, inicio + maxPaginas - 1);
    
    if (fin - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fin - maxPaginas + 1);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }
}