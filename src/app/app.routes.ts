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
        path: 'canciones',
        loadComponent: () => import('./pages/admin/canciones-component/canciones-component').then(m => m.CancionesComponent)
    },
    {
        path: 'albumes',
        loadComponent: () => import('./pages/admin/album-component/album-component').then(m => m.AlbumComponent)
    },
    {
        path: 'artistas',
        loadComponent: () => import('./pages/admin/artistas-component/artistas-component').then(m => m.ArtistasComponent)
    },
];
