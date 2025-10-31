import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiServices } from '../../shared/services/api-services';
import { NavbarComponent } from '../../shared/components/navbar-component/navbar-component';

interface Artista {
  id?: any;
  nombre: string;
  canciones?: number;
  albumes?: number;
  activo?: number; // ✅ Cambiado a number (0 o 1)
  fechaCreacion?: Date;
}

@Component({
  selector: 'app-crear-artistas-component',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './crear-artistas-component.html',
  styleUrl: './crear-artistas-component.css'
})
export class CrearArtistasComponent implements OnInit {
  artistas: Artista[] = [];
  artistasOriginales: Artista[] = []; // ✅ Mantener datos originales
  nuevoArtista: string = '';
  searchTerm: string = '';
  sortOrder: string = 'nombre-asc';
  
  // Estadísticas
  totalArtistas: number = 0;
  artistasActivos: number = 0; // ✅ Nueva estadística
  nuevosEsteMes: number = 0;
  artistaMasPopular: string = '-';
  
  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  // Estados
  loading: boolean = false;
  error: string = '';
  successMessage: string = '';

  constructor(private apiServices: ApiServices) {}

  ngOnInit(): void {
    this.cargarArtistas();
  }

  // Cargar todos los artistas
  cargarArtistas(): void {
    this.loading = true;
    this.error = '';
    
    this.apiServices.getArtistas().subscribe({
      next: (response) => {
        this.artistasOriginales = response.data || response;
        this.totalArtistas = this.artistasOriginales.length;
        this.calcularEstadisticas();
        this.aplicarFiltrosYOrdenamiento();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar artistas:', error);
        this.error = 'Error al cargar los artistas. Por favor, intenta de nuevo.';
        this.loading = false;
        this.artistasOriginales = [];
        this.artistas = [];
      }
    });
  }

  // Agregar nuevo artista
  agregarArtista(event: Event): void {
    event.preventDefault();
    
    if (!this.nuevoArtista.trim()) {
      this.error = 'El nombre del artista no puede estar vacío';
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    const artistaData = {
      nombre: this.nuevoArtista.trim(),
      activo: 1 // ✅ Por defecto activo
    };

    this.apiServices.crearArtista(artistaData).subscribe({
      next: (response) => {
        this.successMessage = `Artista "${this.nuevoArtista}" agregado exitosamente`;
        this.nuevoArtista = '';
        this.cargarArtistas();
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error al agregar artista:', error);
        this.error = error.error?.message || 'Error al agregar el artista. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  // Editar artista
  editarArtista(artista: Artista): void {
    const nuevoNombre = prompt('Editar nombre del artista:', artista.nombre);
    
    if (nuevoNombre && nuevoNombre.trim() && nuevoNombre !== artista.nombre) {
      this.loading = true;
      
      const artistaData = {
        nombre: nuevoNombre.trim(),
        activo: artista.activo // ✅ Mantener estado actual
      };

      this.apiServices.actualizarArtista(artista.id, artistaData).subscribe({
        next: (response) => {
          this.successMessage = 'Artista actualizado exitosamente';
          this.cargarArtistas();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error al editar artista:', error);
          this.error = 'Error al editar el artista. Por favor, intenta de nuevo.';
          this.loading = false;
        }
      });
    }
  }

  // ✅ NUEVO: Toggle estado activo/inactivo
  toggleEstadoArtista(artista: Artista): void {
    const nuevoEstado = artista.activo === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';
    
    if (confirm(`¿Estás seguro de ${accion} al artista "${artista.nombre}"?`)) {
      this.loading = true;
      
      const artistaData = {
        nombre: artista.nombre,
        activo: nuevoEstado
      };

      this.apiServices.actualizarArtista(artista.id, artistaData).subscribe({
        next: (response) => {
          this.successMessage = `Artista "${artista.nombre}" ${nuevoEstado === 1 ? 'activado' : 'desactivado'} exitosamente`;
          this.cargarArtistas();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error al cambiar estado del artista:', error);
          this.error = 'Error al cambiar el estado del artista. Por favor, intenta de nuevo.';
          this.loading = false;
        }
      });
    }
  }

  // Eliminar artista
  eliminarArtista(artista: Artista): void {
    if (confirm(`¿Estás seguro de eliminar al artista "${artista.nombre}"? Esta acción no se puede deshacer.`)) {
      this.loading = true;

      this.apiServices.eliminarArtista(artista.id).subscribe({
        next: (response) => {
          this.successMessage = `Artista "${artista.nombre}" eliminado exitosamente`;
          this.cargarArtistas();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error al eliminar artista:', error);
          this.error = 'Error al eliminar el artista. Por favor, intenta de nuevo.';
          this.loading = false;
        }
      });
    }
  }

  // Ver detalles del artista
  verDetalles(artista: Artista): void {
    const estado = artista.activo === 1 ? 'Activo' : 'Inactivo';
    alert(`Detalles de ${artista.nombre}\n\nCanciones: ${artista.canciones || 0}\nÁlbumes: ${artista.albumes || 0}\nEstado: ${estado}`);
  }

  // Calcular estadísticas
  calcularEstadisticas(): void {
    // Artistas activos
    this.artistasActivos = this.artistasOriginales.filter(a => a.activo === 1).length;
    
    // Nuevos este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    this.nuevosEsteMes = this.artistasOriginales.filter(artista => {
      if (artista.fechaCreacion) {
        const fecha = new Date(artista.fechaCreacion);
        return fecha >= inicioMes;
      }
      return false;
    }).length;

    // Artista más popular (el que tenga más canciones)
    if (this.artistasOriginales.length > 0) {
      const masPopular = this.artistasOriginales.reduce((prev, current) => 
        (current.canciones || 0) > (prev.canciones || 0) ? current : prev
      );
      this.artistaMasPopular = masPopular.nombre;
    }
  }

  // ✅ Aplicar filtros y ordenamiento - CORREGIDO
  aplicarFiltrosYOrdenamiento(): void {
    let artistasFiltrados = [...this.artistasOriginales];

    // Filtrar por búsqueda
    if (this.searchTerm) {
      artistasFiltrados = artistasFiltrados.filter(artista =>
        artista.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Ordenar
    switch (this.sortOrder) {
      case 'nombre-asc':
        artistasFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'nombre-desc':
        artistasFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case 'fecha':
        artistasFiltrados.sort((a, b) => {
          const fechaA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
          const fechaB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
          return fechaB - fechaA;
        });
        break;
      case 'popular':
        artistasFiltrados.sort((a, b) => (b.canciones || 0) - (a.canciones || 0));
        break;
      case 'activo': // ✅ Nuevo: ordenar por estado
        artistasFiltrados.sort((a, b) => (b.activo || 0) - (a.activo || 0));
        break;
    }

    this.artistas = artistasFiltrados;
    this.totalPages = Math.ceil(this.artistas.length / this.itemsPerPage);
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  // ✅ Verificar si el artista está activo
  isActivo(artista: Artista): boolean {
    return artista.activo === 1;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.aplicarFiltrosYOrdenamiento();
  }

  onSortChange(): void {
    this.aplicarFiltrosYOrdenamiento();
  }

  get artistasPaginados(): Artista[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.artistas.slice(startIndex, endIndex);
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