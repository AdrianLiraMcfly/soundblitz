import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiServices } from '../../shared/services/api-services';

interface Artista {
  id?: any;
  nombre: string;
  canciones?: number;
  albumes?: number;
  fechaCreacion?: Date;
}

@Component({
  selector: 'app-crear-artistas-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-artistas-component.html',
  styleUrl: './crear-artistas-component.css'
})
export class CrearArtistasComponent implements OnInit {
  artistas: Artista[] = [];
  nuevoArtista: string = '';
  searchTerm: string = '';
  sortOrder: string = 'nombre-asc';
  
  // Estadísticas
  totalArtistas: number = 0;
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
        this.artistas = response.data || response;
        this.totalArtistas = this.artistas.length;
        this.calcularEstadisticas();
        this.aplicarFiltrosYOrdenamiento();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar artistas:', error);
        this.error = 'Error al cargar los artistas. Por favor, intenta de nuevo.';
        this.loading = false;
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
      nombre: this.nuevoArtista.trim()
    };

    this.apiServices.crearArtista(artistaData).subscribe({
      next: (response) => {
        this.successMessage = `Artista "${this.nuevoArtista}" agregado exitosamente`;
        this.nuevoArtista = '';
        this.cargarArtistas();
        
        // Limpiar mensaje después de 3 segundos
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
        nombre: nuevoNombre.trim()
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

  // Eliminar artista
  eliminarArtista(artista: Artista): void {
    if (confirm(`¿Estás seguro de eliminar al artista "${artista.nombre}"?`)) {
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
    // Aquí puedes navegar a una página de detalles o abrir un modal
    console.log('Ver detalles de:', artista);
    alert(`Detalles de ${artista.nombre}\n\nCanciones: ${artista.canciones || 0}\nÁlbumes: ${artista.albumes || 0}`);
  }

  // Calcular estadísticas
  calcularEstadisticas(): void {
    // Nuevos este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    this.nuevosEsteMes = this.artistas.filter(artista => {
      if (artista.fechaCreacion) {
        const fecha = new Date(artista.fechaCreacion);
        return fecha >= inicioMes;
      }
      return false;
    }).length;

    // Artista más popular (el que tenga más canciones)
    if (this.artistas.length > 0) {
      const masPopular = this.artistas.reduce((prev, current) => 
        (current.canciones || 0) > (prev.canciones || 0) ? current : prev
      );
      this.artistaMasPopular = masPopular.nombre;
    }
  }

  // Aplicar filtros y ordenamiento
  aplicarFiltrosYOrdenamiento(): void {
    let artistasFiltrados = [...this.artistas];

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
    }

    this.artistas = artistasFiltrados;
    this.totalPages = Math.ceil(this.artistas.length / this.itemsPerPage);
  }

  // Buscar artistas
  onSearch(): void {
    this.currentPage = 1;
    this.aplicarFiltrosYOrdenamiento();
  }

  // Cambiar ordenamiento
  onSortChange(): void {
    this.aplicarFiltrosYOrdenamiento();
  }

  // Obtener artistas paginados
  get artistasPaginados(): Artista[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.artistas.slice(startIndex, endIndex);
  }

  // Obtener iniciales del artista
  getIniciales(nombre: string): string {
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  }

  // Obtener color aleatorio para avatar
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

  // Formatear fecha
  formatearFecha(fecha: Date | undefined): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Navegación de paginación
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

  // Obtener rango de páginas para mostrar
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