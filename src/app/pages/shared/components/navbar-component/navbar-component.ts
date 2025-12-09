import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiServices } from '../../services/api-services';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService, Usuario } from '../../services/auth-service';


interface SearchResult {
  type: 'cancion' | 'album' | 'artista';
  id: any;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  artista?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar-component.html',
  styleUrl: './navbar-component.css'
})
export class NavbarComponent implements OnInit {
  @Input() isAdmin: boolean = false; // Mantener para compatibilidad, pero usaremos el servicio
  
  currentUser: Usuario | null = null;
  isAdminUser: boolean = false;
  isMenuOpen: boolean = false;
  private userSubscription?: Subscription;

  @Output() onSearch: EventEmitter<string> = new EventEmitter<string>();
  @Output() onQRScannerOpen: EventEmitter<void> = new EventEmitter<void>();

  searchQuery: string = '';
  searchResults: SearchResult[] = [];
  showSearchResults: boolean = false;
  isSearching: boolean = false;
  
  private searchSubject = new Subject<string>();

  constructor(
    private router: Router,
    private apiServices: ApiServices,
    private authService: AuthService  
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdminUser = this.authService.isAdmin();
    });
    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(300), // Esperar 300ms después de que el usuario deje de escribir
      distinctUntilChanged() // Solo buscar si el término cambió
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.searchSubject.complete();
  }

    toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
      this.authService.logout();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.isMenuOpen = false;
  }

  // Búsqueda
  onSearchChange(): void {
    this.onSearch.emit(this.searchQuery);
    
    if (this.searchQuery.trim().length >= 2) {
      this.searchSubject.next(this.searchQuery.trim());
    } else {
      this.searchResults = [];
      this.showSearchResults = false;
    }
  }

  performSearch(query: string): void {
    if (!query || query.length < 2) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }

    this.isSearching = true;
    const lowerQuery = query.toLowerCase();

    // Buscar en paralelo en todas las entidades
    Promise.all([
      this.searchCanciones(lowerQuery),
      this.searchAlbumes(lowerQuery),
      this.searchArtistas(lowerQuery)
    ]).then(([canciones, albumes, artistas]) => {
      this.searchResults = [...canciones, ...albumes, ...artistas];
      this.showSearchResults = this.searchResults.length > 0;
      this.isSearching = false;
    }).catch(error => {
      console.error('Error en búsqueda:', error);
      this.isSearching = false;
      this.searchResults = [];
      this.showSearchResults = false;
    });
  }

  private searchCanciones(query: string): Promise<SearchResult[]> {
    return new Promise((resolve) => {
      this.apiServices.getCanciones().subscribe({
        next: (response) => {
          console.log('🚀 Navbar Component - Respuesta de canciones:', response);
          const canciones = response.data || response || [];
          const resultados: SearchResult[] = canciones
            .filter((cancion: any) => 
              cancion.nombre?.toLowerCase().includes(query) ||
              cancion.artistaNombre?.toLowerCase().includes(query)
            )
            .slice(0, 5) // Limitar a 5 resultados
            .map((cancion: any) => ({
              type: 'cancion' as const,
              id: cancion.id,
              nombre: cancion.nombre,
              descripcion: cancion.artistaNombre,
              imagen: cancion.url_portada,
              artista: cancion.artistaNombre
            }));
          resolve(resultados);
        },
        error: () => resolve([])
      });
    });
  }

  private searchAlbumes(query: string): Promise<SearchResult[]> {
    return new Promise((resolve) => {
      this.apiServices.getAlbumes().subscribe({
        next: (response) => {
          const albumes = response.data || response || [];
          const resultados: SearchResult[] = albumes
            .filter((album: any) => 
              album.nombre?.toLowerCase().includes(query) ||
              album.artistaNombre?.toLowerCase().includes(query)
            )
            .slice(0, 5)
            .map((album: any) => ({
              type: 'album' as const,
              id: album.id,
              nombre: album.nombre,
              descripcion: `${album.artistaNombre} • ${album.anio}`,
              imagen: album.url_portada,
              artista: album.artistaNombre
            }));
          resolve(resultados);
        },
        error: () => resolve([])
      });
    });
  }

  private searchArtistas(query: string): Promise<SearchResult[]> {
    return new Promise((resolve) => {
      this.apiServices.getArtistas().subscribe({
        next: (response) => {
          const artistas = response.data || response || [];
          const resultados: SearchResult[] = artistas
            .filter((artista: any) => 
              artista.nombre?.toLowerCase().includes(query)
            )
            .slice(0, 5)
            .map((artista: any) => ({
              type: 'artista' as const,
              id: artista.id,
              nombre: artista.nombre,
              descripcion: 'Artista',
              imagen: artista.imagen || artista.url_imagen
            }));
          resolve(resultados);
        },
        error: () => resolve([])
      });
    });
  }

  selectSearchResult(result: SearchResult): void {
    this.showSearchResults = false;
    this.searchQuery = '';
    this.searchResults = [];

    // Navegar según el tipo de resultado
    switch (result.type) {
      case 'cancion':
        this.router.navigate(['/cancion', result.id]);
        break;
      case 'album':
        this.router.navigate(['/album', result.id]);
        break;
      case 'artista':
        this.router.navigate(['/artista', result.id]);
        break;
    }
  }

  closeSearchResults(): void {
    setTimeout(() => {
      this.showSearchResults = false;
    }, 200);
  }

  getResultIcon(type: string): string {
    switch (type) {
      case 'cancion':
        return 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3';
      case 'album':
        return 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10';
      case 'artista':
        return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
      default:
        return 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z';
    }
  }

  getResultBadgeColor(type: string): string {
    switch (type) {
      case 'cancion':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'album':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'artista':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }

  getInitials(nombre: string): string {
    if (!nombre) return '?';
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
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
    this.router.navigate(['crear-canciones']);
  }

  manageSongCategories(): void {
    this.router.navigate(['generos']);
  }

  // Navegación - Álbumes
  navigateToAlbums(): void {
    this.router.navigate(['crear-albumes']);
  }

  openAddAlbumModal(): void {
    this.router.navigate(['crear-albumes']);
  }

  // Navegación - Artistas
  navigateToArtists(): void {
    this.router.navigate(['crear-artistas']);
  }

  // Navegación - Admin
  navigateToUsers(): void {
    this.router.navigate(['usuarios']);
  }

  openAnalytics(): void {
    this.router.navigate(['analytics']);
  }

  openSystemSettings(): void {
    this.router.navigate(['configuracion']);
  }

  // Usuario
  openProfile(): void {
    this.router.navigate(['/perfil']);
  }

  openSettings(): void {
    this.router.navigate(['/configuracion']);
  }

  

}