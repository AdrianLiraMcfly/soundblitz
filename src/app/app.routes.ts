import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
    },  
    {
        path: 'login',
        loadComponent: () => import('./pages/auth/login-component/login-component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./pages/auth/register-component/register-component').then(m => m.RegisterComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard-component/dashboard-component').then(m => m.DashboardComponent)
    },
    {
        path: 'crear-canciones',
        loadComponent: () => import('./pages/admin/crear-canciones-component/crear-canciones-component').then(m => m.CrearCancionesComponent)
    },
    {
        path: 'crear-albumes',
        loadComponent: () => import('./pages/admin/crear-albumes-component/crear-albumes-component').then(m => m.CrearAlbumesComponent)
    },
    {
        path: 'crear-artistas',
        loadComponent: () => import('./pages/admin/crear-artistas-component/crear-artistas-component').then(m => m.CrearArtistasComponent)
    },
    {
        path: 'artista/:id',
        loadComponent: () => import('./pages/lista-canciones-component/lista-canciones-component').then(m => m.ListaCancionesComponent)
    },
    {
        path: 'album/:id',
        loadComponent: () => import('./pages/lista-canciones-component/lista-canciones-component').then(m => m.ListaCancionesComponent)
    },

];
