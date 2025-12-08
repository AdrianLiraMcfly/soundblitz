import { Routes } from '@angular/router';
import { authGuard } from './pages/shared/guard/auth-guard';
import { adminGuard } from './pages/shared/guard/admin-guard-guard';
import { guestGuard } from './pages/shared/guard/guest-guard';
import { userGuard } from './pages/shared/guard/user-guard-guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
    },  
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/auth/login-component/login-component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/auth/register-component/register-component').then(m => m.RegisterComponent)
    },
    {
    path: 'verify-code',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/verify-code-component/verify-code-component').then(m => m.VerifyCodeComponent)
    },
    {
        path: 'dashboard',
        canActivate: [authGuard, userGuard],
        loadComponent: () => import('./pages/dashboard-component/dashboard-component').then(m => m.DashboardComponent)
    },
    {
        path: 'artista/:id',
        canActivate: [authGuard, userGuard],
        loadComponent: () => import('./pages/lista-canciones-component/lista-canciones-component').then(m => m.ListaCancionesComponent)
    },
    {
        path: 'album/:id',
        canActivate: [authGuard, userGuard],
        loadComponent: () => import('./pages/lista-canciones-component/lista-canciones-component').then(m => m.ListaCancionesComponent)
    },
    {
        path: 'favoritas',
        canActivate: [authGuard, userGuard],
        loadComponent: () => import('./pages/favoritos-component/favoritos-component').then(m => m.FavoritasComponent)
    },
      // ✅ Rutas de administración con panel
    {
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin-panel/admin-panel').then(m => m.AdminPanelComponent),
        canActivate: [authGuard, adminGuard],
        children: [
        { path: '', redirectTo: 'canciones', pathMatch: 'full' },
        { path: 'artistas', loadComponent: () => import('./pages/admin/crear-artistas-component/crear-artistas-component').then(m => m.CrearArtistasComponent) },
        { path: 'albumes', loadComponent: () => import('./pages/admin/crear-albumes-component/crear-albumes-component').then(m => m.CrearAlbumesComponent) },
        { path: 'canciones', loadComponent: () => import('./pages/admin/crear-canciones-component/crear-canciones-component').then(m => m.CrearCancionesComponent) },
        { path: 'usuarios', loadComponent: () => import('./pages/admin/usuarios-component/usuarios-component').then(m => m.UsuariosComponent) }
        ]
    }
];
