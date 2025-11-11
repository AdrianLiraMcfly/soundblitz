import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiServices } from '../shared/services/api-services';
import { PlayerService } from '../shared/services/playing-service';
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

  // Data from DB
  artistas: any[] = [];
  albumes: any[] = [];
  canciones: any[] = [];
  cancionesFavoritas: any[] = [];
  loading: boolean = true;

  // QR Scanner
  showQRScanner: boolean = false;
  qrScanning: boolean = false;
  showQRSuccess: boolean = false;
  scannedSong: any = null;

  constructor(
    private router: Router,
    private apiServices: ApiServices,
    private playerService: PlayerService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Dashboard inicializado');
    this.loadUserData();
    this.loadAllData();
  }

  // Cargar datos del usuario
  private loadUserData(): void {
    const userDataStr = localStorage.getItem('user_data');
    console.log('🔍 Cargando datos del usuario desde localStorage:', userDataStr);
    
    if (userDataStr) {
      try {
        this.currentUser = JSON.parse(userDataStr);
        console.log('✅ Usuario cargado:', this.currentUser);
      } catch (error) {
        console.error('❌ Error al parsear datos del usuario:', error);
      }
    }
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

  // Reproducción
  reproducirCancion(cancion: any): void {
    this.playerService.playSong({
      id: cancion.id,
      nombre: cancion.nombre,
      artista_id: cancion.artista_id,
      artistaNombre: cancion.artistaNombre,
      album_id: cancion.album_id,
      albumNombre: cancion.albumNombre,
      url_cancion: cancion.url_cancion,
      url_portada: cancion.url_portada,
      duracion: cancion.duracion
    });
  }

  // Favoritos
  agregarAFavoritos(cancion: any): void {
    const index = this.cancionesFavoritas.findIndex(c => c.id === cancion.id);
    if (index === -1) {
      this.cancionesFavoritas.push(cancion);
      console.log('❤️ Canción agregada a favoritos:', cancion.nombre);
    } else {
      this.cancionesFavoritas.splice(index, 1);
      console.log('💔 Canción removida de favoritos:', cancion.nombre);
    }
    // Aquí podrías guardar en localStorage o BD
    localStorage.setItem('favoritos', JSON.stringify(this.cancionesFavoritas));
  }

  esFavorito(cancionId: any): boolean {
    return this.cancionesFavoritas.some(c => c.id === cancionId);
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