import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar-component.html',
  styleUrl: './navbar-component.css'
})
export class NavbarComponent implements OnInit {
  @Input() currentUser: any = null;
  @Input() isAdmin: boolean = false;
  @Input() adminNotificationsCount: number = 0;
  
  @Output() onSearch = new EventEmitter<string>();
  @Output() onQRScannerOpen = new EventEmitter<void>();
  @Output() onLogout = new EventEmitter<void>();
  
  searchQuery: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Inicialización si es necesaria
  }

  // Búsqueda
  onSearchChange(): void {
    this.onSearch.emit(this.searchQuery);
  }

  // QR Scanner
  openQRScanner(): void {
    this.onQRScannerOpen.emit();
  }

  // Navegación - Canciones
  navigateToSongs(): void {
    this.router.navigate(['crear-canciones']);
  }

  openAddSongModal(): void {
    // Emitir evento o navegar a crear canción
    this.router.navigate(['crear-canciones']);
  }

  manageSongCategories(): void {
    this.router.navigate(['/admin/generos']);
  }

  // Navegación - Álbumes
  navigateToAlbums(): void {
    this.router.navigate(['crear-albumes']);
  }

  openAddAlbumModal(): void {
    this.router.navigate(['/admin/crear-albumes']);
  }

  // Navegación - Artistas
  navigateToArtists(): void {
    this.router.navigate(['/admin/crear-artistas']);
  }

  // Navegación - Admin
  navigateToUsers(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  openAnalytics(): void {
    this.router.navigate(['/admin/analytics']);
  }

  openSystemSettings(): void {
    this.router.navigate(['/admin/configuracion']);
  }

  // Usuario
  openProfile(): void {
    this.router.navigate(['/perfil']);
  }

  openSettings(): void {
    this.router.navigate(['/configuracion']);
  }

  logout(): void {
    this.onLogout.emit();
  }
}