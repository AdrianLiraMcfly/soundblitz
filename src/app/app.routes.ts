import { Routes } from '@angular/router';
import { authGuard } from './pages/shared/guard/auth-guard';
import { adminGuard } from './pages/shared/guard/admin-guard-guard';
import { guestGuard } from './pages/shared/guard/guest-guard';

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
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/dashboard-component/dashboard-component').then(m => m.DashboardComponent)
    },
    {
        path: 'crear-canciones',
        canActivate: [authGuard, adminGuard],
        loadComponent: () => import('./pages/admin/crear-canciones-component/crear-canciones-component').then(m => m.CrearCancionesComponent)
    },
    {
        path: 'crear-albumes',
        canActivate: [authGuard, adminGuard],
        loadComponent: () => import('./pages/admin/crear-albumes-component/crear-albumes-component').then(m => m.CrearAlbumesComponent)
    },
    {
        path: 'crear-artistas',
        canActivate: [authGuard, adminGuard],
        loadComponent: () => import('./pages/admin/crear-artistas-component/crear-artistas-component').then(m => m.CrearArtistasComponent)
    },
    {
        path: 'artista/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/lista-canciones-component/lista-canciones-component').then(m => m.ListaCancionesComponent)
    },
    {
        path: 'album/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/lista-canciones-component/lista-canciones-component').then(m => m.ListaCancionesComponent)
    },
    {
        path: 'favoritas',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/favoritos-component/favoritos-component').then(m => m.FavoritasComponent)
    }
];
