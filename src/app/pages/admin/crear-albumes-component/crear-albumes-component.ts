import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiServices } from '../../shared/services/api-services';

interface Album {
  id?: any;
  nombre: string;
  artista_id: any;
  artistaNombre?: string;
  anio: number | null;
  genero: string;
  canciones?: number;
  activo?: number; // ✅ Cambiado a number (0 o 1)
  fechaCreacion?: Date;
}
interface Artista {
  id: any;
  nombre: string;
}

@Component({
  selector: 'app-crear-albumes-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-albumes-component.html',
  styleUrl: './crear-albumes-component.css'
})
export class CrearAlbumesComponent implements OnInit {
  albumes: Album[] = [];
  albumesOriginales: Album[] = []; // ✅ Nuevo: mantener datos originales
  artistas: Artista[] = [];
  
  // Formulario
  nuevoAlbum: Album = {
    nombre: '',
    artista_id: '',
    anio: null,
    genero: '',
    activo: 1 // ✅ Por defecto activo (1)
  };
  
  searchTerm: string = '';
  sortOrder: string = 'nombre-asc';
  
  // Estadísticas
  totalAlbumes: number = 0;
  nuevosEsteMes: number = 0;
  albumMasPopular: string = '-';
  
  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  // Estados
  loading: boolean = false;
  error: string = '';
  successMessage: string = '';
  mostrarFormulario: boolean = false;

  constructor(private apiServices: ApiServices) {}

  ngOnInit(): void {
    this.cargarArtistas();
    this.cargarAlbumes();
  }

  // Cargar artistas para el selector
  cargarArtistas(): void {
    this.apiServices.getArtistas().subscribe({
      next: (response) => {
        this.artistas = response.data || response;
      },
      error: (error) => {
        console.error('Error al cargar artistas:', error);
      }
    });
  }

  // Cargar todos los álbumes
  cargarAlbumes(): void {
    this.loading = true;
    this.error = '';
    
    this.apiServices.getAlbumes().subscribe({
      next: (response) => {
        const albumesData = response.data || response;
        
        // Agregar nombre del artista a cada álbum
        albumesData.forEach((album: Album) => {
          const artista = this.artistas.find(a => a.id === album.artista_id);
          album.artistaNombre = artista ? artista.nombre : 'Desconocido';
        });
        
        this.albumesOriginales = [...albumesData]; // ✅ Guardar originales
        this.totalAlbumes = this.albumesOriginales.length;
        this.calcularEstadisticas();
        this.aplicarFiltrosYOrdenamiento();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar álbumes:', error);
        this.error = 'Error al cargar los álbumes. Por favor, intenta de nuevo.';
        this.loading = false;
        this.albumesOriginales = []; // ✅ Asegurar que esté vacío
        this.albumes = []; // ✅ Asegurar que esté vacío
      }
    });
  }

  // Agregar nuevo álbum
  agregarAlbum(event: Event): void {
    event.preventDefault();
    
    if (!this.nuevoAlbum.nombre.trim()) {
      this.error = 'El nombre del álbum no puede estar vacío';
      return;
    }

    if (!this.nuevoAlbum.artista_id) {
      this.error = 'Debes seleccionar un artista';
      return;
    }

    if (!this.nuevoAlbum.genero.trim()) {
      this.error = 'El género no puede estar vacío';
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    const albumData = {
      nombre: this.nuevoAlbum.nombre.trim(),
      artista_id: this.nuevoAlbum.artista_id,
      anio: this.nuevoAlbum.anio,
      genero: this.nuevoAlbum.genero.trim(),
      activo: this.nuevoAlbum.activo !== undefined ? this.nuevoAlbum.activo : 1 // ✅ Asegurar 0 o 1
    };

    this.apiServices.crearAlbum(albumData).subscribe({
      next: (response) => {
        this.successMessage = `Álbum "${this.nuevoAlbum.nombre}" agregado exitosamente`;
        this.resetFormulario();
        this.cargarAlbumes();
        this.mostrarFormulario = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error al agregar álbum:', error);
        this.error = error.error?.message || 'Error al agregar el álbum. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  // Editar álbum
  editarAlbum(album: Album): void {
    this.nuevoAlbum = { ...album };
    this.mostrarFormulario = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Actualizar álbum
  actualizarAlbum(): void {
    if (!this.nuevoAlbum.id) return;

    this.loading = true;
    
    const albumData = {
      nombre: this.nuevoAlbum.nombre.trim(),
      artista_id: this.nuevoAlbum.artista_id,
      anio: this.nuevoAlbum.anio,
      genero: this.nuevoAlbum.genero.trim(),
      activo: this.nuevoAlbum.activo
    };

    this.apiServices.actualizarAlbum(this.nuevoAlbum.id, albumData).subscribe({
      next: (response) => {
        this.successMessage = 'Álbum actualizado exitosamente';
        this.resetFormulario();
        this.cargarAlbumes();
        this.mostrarFormulario = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error al editar álbum:', error);
        this.error = 'Error al editar el álbum. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  // Eliminar álbum
  eliminarAlbum(album: Album): void {
    if (confirm(`¿Estás seguro de eliminar el álbum "${album.nombre}"?`)) {
      this.loading = true;

      this.apiServices.eliminarAlbum(album.id).subscribe({
        next: (response) => {
          this.successMessage = `Álbum "${album.nombre}" eliminado exitosamente`;
          this.cargarAlbumes();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error al eliminar álbum:', error);
          this.error = 'Error al eliminar el álbum. Por favor, intenta de nuevo.';
          this.loading = false;
        }
      });
    }
  }

  // Resetear formulario
  resetFormulario(): void {
    this.nuevoAlbum = {
      nombre: '',
      artista_id: '',
      anio: null,
      genero: '',
      activo: 1 // ✅ Por defecto activo
    };
  }

  // ✅ Verificar si el álbum está activo
  isActivo(album: Album): boolean {
    return album.activo === 1;
  }

  // Cancelar edición
  cancelarEdicion(): void {
    this.resetFormulario();
    this.mostrarFormulario = false;
  }

  // Toggle formulario
  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.resetFormulario();
    }
  }

    toggleEstadoAlbum(album: Album): void {
    const nuevoEstado = album.activo === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';
    
    if (confirm(`¿Estás seguro de ${accion} el álbum "${album.nombre}"?`)) {
      this.loading = true;
      
      const albumData = {
        nombre: album.nombre,
        artista_id: album.artista_id,
        anio: album.anio,
        genero: album.genero,
        activo: nuevoEstado
      };

      this.apiServices.actualizarAlbum(album.id, albumData).subscribe({
        next: (response) => {
          this.successMessage = `Álbum "${album.nombre}" ${nuevoEstado === 1 ? 'activado' : 'desactivado'} exitosamente`;
          this.cargarAlbumes();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error al cambiar estado del álbum:', error);
          this.error = 'Error al cambiar el estado del álbum. Por favor, intenta de nuevo.';
          this.loading = false;
        }
      });
    }
  }

  // Calcular estadísticas
  calcularEstadisticas(): void {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    this.nuevosEsteMes = this.albumesOriginales.filter(album => {
      if (album.fechaCreacion) {
        const fecha = new Date(album.fechaCreacion);
        return fecha >= inicioMes;
      }
      return false;
    }).length;

    if (this.albumesOriginales.length > 0) {
      const masPopular = this.albumesOriginales.reduce((prev, current) => 
        (current.canciones || 0) > (prev.canciones || 0) ? current : prev
      );
      this.albumMasPopular = masPopular.nombre;
    }
  }

  // ✅ Aplicar filtros y ordenamiento - CORREGIDO
  aplicarFiltrosYOrdenamiento(): void {
    let albumesFiltrados = [...this.albumesOriginales]; // ✅ Usar originales

    if (this.searchTerm) {
      albumesFiltrados = albumesFiltrados.filter(album =>
        album.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        album.artistaNombre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        album.genero.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    switch (this.sortOrder) {
      case 'nombre-asc':
        albumesFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'nombre-desc':
        albumesFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case 'artista':
        albumesFiltrados.sort((a, b) => (a.artistaNombre || '').localeCompare(b.artistaNombre || ''));
        break;
      case 'anio':
        albumesFiltrados.sort((a, b) => (b.anio || 0) - (a.anio || 0));
        break;
      case 'fecha':
        albumesFiltrados.sort((a, b) => {
          const fechaA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
          const fechaB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
          return fechaB - fechaA;
        });
        break;
    }

    this.albumes = albumesFiltrados; // ✅ Asignar filtrados
    this.totalPages = Math.ceil(this.albumes.length / this.itemsPerPage);
    
    // ✅ Resetear página si no hay resultados en la página actual
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

  get albumesPaginados(): Album[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.albumes.slice(startIndex, endIndex);
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

  get anioActual(): number {
    return new Date().getFullYear();
  }

  get aniosDisponibles(): number[] {
    const anioActual = this.anioActual;
    const anios: number[] = [];
    for (let i = anioActual; i >= 1950; i--) {
      anios.push(i);
    }
    return anios;
  }
}