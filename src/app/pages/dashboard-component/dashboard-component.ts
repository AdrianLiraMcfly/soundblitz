import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiServices } from '../shared/services/api-services';
import { NavbarComponent } from '../shared/components/navbar-component/navbar-component';

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
  isAdmin: boolean = false;
  adminNotificationsCount: number = 0;

  // Search
  searchQuery: string = '';

  // QR Scanner
  showQRScanner: boolean = false;
  qrScanning: boolean = false;
  showQRSuccess: boolean = false;
  scannedSong: any = null;

  // Music player
  currentSong: any = null;

  constructor(
    private router: Router,
    private apiServices: ApiServices
  ) {}

  ngOnInit(): void {
    console.log('🚀 Dashboard inicializado');
    this.loadUserData();
    this.checkAdminNotifications();
  }

  // ===== USER MANAGEMENT =====
  private loadUserData(): void {
    const userStr = localStorage.getItem('user');
    console.log('🔍 Cargando datos del usuario desde localStorage:', userStr);
    
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
      const role_id = this.currentUser.rol_id; // Fixed: use rol_id instead of role_id
      this.isAdmin = role_id === 1; // Set admin status based on role
      console.log('🔍 Cargando datos del usuario, role_id:', role_id);
      console.log('🔍 Es administrador:', this.isAdmin);
    }
  }

  private checkAdminNotifications(): void {
    if (this.isAdmin) {
      // Simular notificaciones de admin - en producción obtener de la API
      this.adminNotificationsCount = 5;
    }
  }

  // ===== NAVIGATION METHODS FOR ADMIN =====
  
  // Canciones
  navigateToSongs(): void {
    console.log('🎵 Navegando a gestión de canciones');
    // Implementar navegación o modal
    alert('Funcionalidad: Ver todas las canciones - Por implementar');
  }

  openAddSongModal(): void {
    this.router.navigate(['/crear-canciones']);
  }

  manageSongCategories(): void {
    console.log('🏷️ Gestionando géneros de canciones');
    alert('Funcionalidad: Gestionar géneros musicales - Por implementar');
  }

  // Álbumes
  navigateToAlbums(): void {
    console.log('💿 Navegando a gestión de álbumes');
    alert('Funcionalidad: Ver todos los álbumes - Por implementar');
  }

  openAddAlbumModal(): void {
    console.log('➕ Abriendo modal para crear álbum');
    alert('Funcionalidad: Crear nuevo álbum - Por implementar');
  }

  manageAlbumGenres(): void {
    console.log('📊 Mostrando estadísticas de álbumes');
    alert('Funcionalidad: Estadísticas de álbumes - Por implementar');
  }

  // Artistas
  navigateToArtists(): void {
    this.router.navigate(['/crear-artistas']);
  }

  openAddArtistModal(): void {
    console.log('➕ Abriendo modal para agregar artista');
    alert('Funcionalidad: Agregar nuevo artista - Por implementar');
  }

  manageArtistVerification(): void {
    console.log('✅ Gestionando verificaciones de artistas');
    alert('Funcionalidad: Sistema de verificación de artistas - Por implementar');
  }

  // Admin general
  navigateToUsers(): void {
    console.log('👥 Navegando a gestión de usuarios');
    alert('Funcionalidad: Gestión de usuarios - Por implementar');
  }

  openAnalytics(): void {
    console.log('📈 Abriendo analíticas y reportes');
    alert('Funcionalidad: Dashboard de analíticas - Por implementar');
  }

  openSystemSettings(): void {
    console.log('⚙️ Abriendo configuración del sistema');
    alert('Funcionalidad: Configuración del sistema - Por implementar');
  }

  // ===== SEARCH =====
  onSearchChange(): void {
    console.log('🔍 Buscando:', this.searchQuery);
    
    if (this.searchQuery.length > 2) {
      // Simular búsqueda
      console.log('Ejecutando búsqueda para:', this.searchQuery);
      
      // En producción, hacer llamada a la API:
      // this.apiServices.buscarContenido(this.searchQuery).subscribe({
      //   next: (results) => {
      //     console.log('Resultados:', results);
      //   },
      //   error: (error) => {
      //     console.error('Error en búsqueda:', error);
      //   }
      // });
    }
  }

  // ===== QR SCANNER =====
  openQRScanner(): void {
    console.log('📷 Abriendo scanner QR');
    this.showQRScanner = true;
    this.startQRScanner();
  }

  closeQRScanner(): void {
    console.log('❌ Cerrando scanner QR');
    this.showQRScanner = false;
    this.qrScanning = false;
    this.stopQRScanner();
  }

  private startQRScanner(): void {
    setTimeout(() => {
      if (this.qrVideo?.nativeElement) {
        navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Cámara trasera
            width: { ideal: 640 },
            height: { ideal: 640 }
          } 
        })
        .then(stream => {
          if (this.qrVideo?.nativeElement) {
            this.qrVideo.nativeElement.srcObject = stream;
            this.qrScanning = true;
            console.log('📹 Cámara iniciada para QR');
            
            // Simular detección de QR después de 3 segundos (para testing)
            setTimeout(() => {
              if (this.qrScanning) {
                this.simulateQRDetection('TEST_QR_CODE_123');
              }
            }, 3000);
          }
        })
        .catch(error => {
          console.error('❌ Error al acceder a la cámara:', error);
          alert('No se pudo acceder a la cámara. Verifica los permisos.');
        });
      }
    }, 100);
  }

  private stopQRScanner(): void {
    if (this.qrVideo?.nativeElement?.srcObject) {
      const stream = this.qrVideo.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Cámara detenida');
      });
      this.qrVideo.nativeElement.srcObject = null;
    }
  }

  switchCamera(): void {
    console.log('🔄 Cambiando cámara (funcionalidad por implementar)');
    alert('Cambio de cámara - Por implementar');
  }

  // Simular detección de QR (reemplazar con librería real)
  private simulateQRDetection(qrCode: string): void {
    console.log('🎯 QR detectado:', qrCode);
    
    // Simular canción encontrada
    const mockSong = {
      id: '123',
      title: 'Canción de Prueba',
      artist: 'Artista de Prueba',
      album: 'Álbum de Prueba'
    };

    this.scannedSong = mockSong;
    this.showQRSuccess = true;
    this.closeQRScanner();
    
    // Ocultar toast después de 3 segundos
    setTimeout(() => {
      this.showQRSuccess = false;
    }, 3000);
    
    // Reproducir canción
    this.playSong(mockSong);

    // En producción usar:
    // this.apiServices.buscarCancionPorQR(qrCode).subscribe({
    //   next: (song) => {
    //     this.scannedSong = song;
    //     this.showQRSuccess = true;
    //     this.closeQRScanner();
    //     this.playSong(song);
    //   },
    //   error: (error) => {
    //     console.error('Error al buscar canción por QR:', error);
    //     alert('No se encontró ninguna canción con este código QR');
    //   }
    // });
  }

  // ===== MUSIC PLAYER =====
  private playSong(song: any): void {
    this.currentSong = song;
    console.log('🎵 Reproduciendo:', song.title, 'de', song.artist);
    
    // En producción registrar reproducción:
    // if (song.id) {
    //   this.apiServices.registrarReproduccion(song.id).subscribe({
    //     next: () => console.log('Reproducción registrada'),
    //     error: (error) => console.error('Error al registrar reproducción:', error)
    //   });
    // }
  }

  // ===== USER MENU =====
  openProfile(): void {
    console.log('👤 Abriendo perfil de usuario');
    alert('Funcionalidad: Perfil de usuario - Por implementar');
    // this.router.navigate(['/profile']);
  }

  openSettings(): void {
    console.log('⚙️ Abriendo configuración');
    alert('Funcionalidad: Configuración de usuario - Por implementar');
    // this.router.navigate(['/settings']);
  }

  logout(): void {
    console.log('👋 Cerrando sesión...');
    
    // Confirmar cierre de sesión
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      // Limpiar datos locales
      this.apiServices.clearAuthData();
      
      // Navegar al login
      this.router.navigate(['/login']).then(() => {
        console.log('✅ Sesión cerrada correctamente');
      });

      // En producción también notificar al servidor:
      // this.apiServices.logout().subscribe({
      //   next: () => {
      //     this.apiServices.clearAuthData();
      //     this.router.navigate(['/login']);
      //   },
      //   error: (error) => {
      //     console.error('Error al cerrar sesión:', error);
      //     // Cerrar sesión localmente aunque falle en el servidor
      //     this.apiServices.clearAuthData();
      //     this.router.navigate(['/login']);
      //   }
      // });
    }
  }

  // ===== LIFECYCLE HOOKS =====
  ngOnDestroy(): void {
    // Limpiar recursos al destruir el componente
    this.stopQRScanner();
  }
}