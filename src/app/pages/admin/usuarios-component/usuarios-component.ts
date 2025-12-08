import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiServices } from '../../shared/services/api-services';
import { NavbarComponent } from '../../shared/components/navbar-component/navbar-component';

interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  password?: string;
  rol_id?: number;
  rol?: number;
  activo?: number;
  fechaCreacion?: Date;
}

@Component({
  selector: 'app-usuarios-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-component.html',
  styleUrl: './usuarios-component.css'
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosOriginales: Usuario[] = [];
  
  // Formulario
  nuevoUsuario = {
    nombre: '',
    email: '',
    password: '',
    rol: 2
  };
  
  searchTerm: string = '';
  sortOrder: string = 'nombre-asc';
  
  // Estadísticas
  totalUsuarios: number = 0;
  usuariosActivos: number = 0;
  nuevosEsteMes: number = 0;
  administradores: number = 0;
  
  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  // Estados
  loading: boolean = false;
  error: string = '';
  successMessage: string = '';
  showForm: boolean = false;
  editingUser: Usuario | null = null;

  constructor(private apiServices: ApiServices) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

cargarUsuarios(): void {
  this.loading = true;
  this.error = '';
  
  console.log('🔄 Cargando usuarios...');
  
  this.apiServices.getUsuarios().subscribe({
    next: (response) => {
      console.log('✅ Respuesta recibida:', response);
      this.usuariosOriginales = response.data || response;
      this.totalUsuarios = this.usuariosOriginales.length;
      this.calcularEstadisticas();
      this.aplicarFiltrosYOrdenamiento();
      this.loading = false;
    },
    error: (error) => {
      console.error('❌ Error al cargar usuarios:', error);
      console.error('❌ Detalles del error:', error.error);
      
      // Mostrar mensaje más específico
      if (error.status === 500) {
        this.error = 'Error del servidor. Verifica que la tabla de roles exista y tenga datos.';
      } else if (error.status === 401) {
        this.error = 'No estás autenticado. Por favor, inicia sesión nuevamente.';
      } else {
        this.error = error.error?.message || 'Error al cargar los usuarios. Por favor, intenta de nuevo.';
      }
      
      this.loading = false;
      this.usuariosOriginales = [];
      this.usuarios = [];
    }
  });
}

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.nuevoUsuario = {
      nombre: '',
      email: '',
      password: '',
      rol: 2
    };
    this.editingUser = null;
  }

  agregarUsuario(event: Event): void {
    event.preventDefault();
    
    if (!this.validarFormulario()) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    const usuarioData = {
      nombre: this.nuevoUsuario.nombre.trim(),
      email: this.nuevoUsuario.email.trim(),
      password: this.nuevoUsuario.password,
      rol: this.nuevoUsuario.rol
    };

    this.apiServices.crearUsuario(usuarioData).subscribe({
      next: (response) => {
        this.successMessage = `Usuario "${this.nuevoUsuario.nombre}" creado exitosamente`;
        this.resetForm();
        this.showForm = false;
        this.cargarUsuarios();
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error al crear usuario:', error);
        this.error = error.error?.message || 'Error al crear el usuario. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  editarUsuario(usuario: Usuario): void {
    this.editingUser = usuario;
    this.nuevoUsuario = {
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol_id || usuario.rol || 2
    };
    this.showForm = true;
  }

  actualizarUsuario(event: Event): void {
    event.preventDefault();
    
    if (!this.editingUser) return;
    
    if (!this.validarFormulario(true)) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    const usuarioData: any = {
      nombre: this.nuevoUsuario.nombre.trim(),
      email: this.nuevoUsuario.email.trim(),
      rol: this.nuevoUsuario.rol
    };

    // Solo incluir password si se proporcionó uno nuevo
    if (this.nuevoUsuario.password) {
      usuarioData.password = this.nuevoUsuario.password;
    }

    this.apiServices.actualizarUsuario(this.editingUser.id!.toString(), usuarioData).subscribe({
      next: (response) => {
        this.successMessage = `Usuario "${this.nuevoUsuario.nombre}" actualizado exitosamente`;
        this.resetForm();
        this.showForm = false;
        this.cargarUsuarios();
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
        this.error = error.error?.message || 'Error al actualizar el usuario. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  eliminarUsuario(usuario: Usuario): void {
    if (confirm(`¿Estás seguro de eliminar al usuario "${usuario.nombre}"? Esta acción no se puede deshacer.`)) {
      this.loading = true;

      this.apiServices.eliminarUsuario(usuario.id!.toString()).subscribe({
        next: (response) => {
          this.successMessage = `Usuario "${usuario.nombre}" eliminado exitosamente`;
          this.cargarUsuarios();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          this.error = 'Error al eliminar el usuario. Por favor, intenta de nuevo.';
          this.loading = false;
        }
      });
    }
  }

  resetearPassword(usuario: Usuario): void {
    const nuevaPassword = prompt(`Ingresa la nueva contraseña para "${usuario.nombre}":`);
    
    if (nuevaPassword && nuevaPassword.length >= 6) {
      this.loading = true;

      this.apiServices.resetPassword(usuario.id!.toString(), nuevaPassword).subscribe({
        next: (response) => {
          this.successMessage = `Contraseña de "${usuario.nombre}" actualizada exitosamente`;
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al resetear contraseña:', error);
          this.error = 'Error al resetear la contraseña. Por favor, intenta de nuevo.';
          this.loading = false;
        }
      });
    } else if (nuevaPassword !== null) {
      alert('La contraseña debe tener al menos 6 caracteres');
    }
  }

  validarFormulario(esEdicion: boolean = false): boolean {
    if (!this.nuevoUsuario.nombre.trim()) {
      this.error = 'El nombre es requerido';
      return false;
    }

    if (this.nuevoUsuario.nombre.trim().length < 3) {
      this.error = 'El nombre debe tener al menos 3 caracteres';
      return false;
    }

    if (!this.nuevoUsuario.email.trim()) {
      this.error = 'El email es requerido';
      return false;
    }

    if (!this.isValidEmail(this.nuevoUsuario.email)) {
      this.error = 'El formato del email no es válido';
      return false;
    }

    // Validar password solo si es nuevo usuario o si se proporcionó en edición
    if (!esEdicion && !this.nuevoUsuario.password) {
      this.error = 'La contraseña es requerida';
      return false;
    }

    if (this.nuevoUsuario.password && this.nuevoUsuario.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }

    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  calcularEstadisticas(): void {
    // Usuarios activos
    this.usuariosActivos = this.usuariosOriginales.filter(u => u.activo === 1).length;
    
    // Administradores
    this.administradores = this.usuariosOriginales.filter(u => 
      (u.rol_id === 1 || u.rol === 1)
    ).length;
    
    // Nuevos este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    this.nuevosEsteMes = this.usuariosOriginales.filter(usuario => {
      if (usuario.fechaCreacion) {
        const fecha = new Date(usuario.fechaCreacion);
        return fecha >= inicioMes;
      }
      return false;
    }).length;
  }

  aplicarFiltrosYOrdenamiento(): void {
    let usuariosFiltrados = [...this.usuariosOriginales];

    // Filtrar por búsqueda
    if (this.searchTerm) {
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Ordenar
    switch (this.sortOrder) {
      case 'nombre-asc':
        usuariosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'nombre-desc':
        usuariosFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case 'email':
        usuariosFiltrados.sort((a, b) => a.email.localeCompare(b.email));
        break;
      case 'fecha':
        usuariosFiltrados.sort((a, b) => {
          const fechaA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
          const fechaB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
          return fechaB - fechaA;
        });
        break;
      case 'rol':
        usuariosFiltrados.sort((a, b) => {
          const rolA = a.rol_id || a.rol || 2;
          const rolB = b.rol_id || b.rol || 2;
          return rolA - rolB;
        });
        break;
    }

    this.usuarios = usuariosFiltrados;
    this.totalPages = Math.ceil(this.usuarios.length / this.itemsPerPage);
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  getRolNombre(usuario: Usuario): string {
    const rol = usuario.rol_id || usuario.rol || 2;
    return rol === 1 ? 'Administrador' : 'Usuario';
  }

  getRolClass(usuario: Usuario): string {
    const rol = usuario.rol_id || usuario.rol || 2;
    return rol === 1 ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }

  onSearch(): void {
    this.currentPage = 1;
    this.aplicarFiltrosYOrdenamiento();
  }

  onSortChange(): void {
    this.aplicarFiltrosYOrdenamiento();
  }

  get usuariosPaginados(): Usuario[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.usuarios.slice(startIndex, endIndex);
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