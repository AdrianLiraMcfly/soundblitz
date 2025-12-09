import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../shared/services/auth-service';
import { ApiServices } from '../../shared/services/api-services';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.css']
})
export class AdminPanelComponent implements OnInit {
  activeTab: 'artistas' | 'albumes' | 'canciones' | 'usuarios' = 'canciones';
  adminNombre: string = '';
  showUserMenu: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private apiServices: ApiServices
  ) {}

  ngOnInit(): void {
    // Verificar que sea admin
    if (!this.authService.isAdmin()) {
      //console.error('⛔ Acceso denegado - No es administrador');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Obtener datos del usuario
    const currentUser = this.authService.currentUserValue;
    this.adminNombre = currentUser?.nombre || 'Admin';
    
    //console.log('👑 Panel de administración cargado');
    
    // Establecer tab activo según la ruta actual
    this.setActiveTabFromRoute();
  }

  // Establecer tab activo según la ruta
  private setActiveTabFromRoute(): void {
    const currentUrl = this.router.url;
    
    if (currentUrl.includes('/artistas')) {
      this.activeTab = 'artistas';
    } else if (currentUrl.includes('/albumes')) {
      this.activeTab = 'albumes';
    } else if (currentUrl.includes('/canciones')) {
      this.activeTab = 'canciones';
    } else if (currentUrl.includes('/usuarios')) {
      this.activeTab = 'usuarios';
    }
  }

  // Navegar entre tabs
  navigateTo(tab: 'artistas' | 'albumes' | 'canciones' | 'usuarios'): void {
    this.activeTab = tab;
    this.router.navigate([`/admin/${tab}`]);
    //console.log(`📍 Navegando a: /admin/${tab}`);
  }

  // Toggle del menú de usuario
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  // Cerrar sesión
  logout(): void {
    //console.log('👋 Cerrando sesión de administrador...');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Ir al dashboard de usuario
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}