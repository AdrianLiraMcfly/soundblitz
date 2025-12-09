import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { PlayerService } from './playing-service';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol_id: number;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<Usuario | null>;
  public currentUser$: Observable<Usuario | null>;

  constructor(private router: Router, private playerService: PlayerService) {
    // Cargar usuario desde localStorage al iniciar
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<Usuario | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  // Obtener usuario actual
  public get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    const user = this.currentUserValue;
    const token = localStorage.getItem('authToken');
    return !!(user && token);
  }

  // Verificar si es admin (rol_id === 1)
  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user?.rol_id === 1;
  }

  // Verificar si es usuario normal (rol_id === 2)
  isUser(): boolean {
    const user = this.currentUserValue;
    return user?.rol_id === 2;
  }

  // Obtener rol del usuario
  getUserRole(): number | null {
    return this.currentUserValue?.rol_id || null;
  }

  // Login - guardar usuario
  login(user: Usuario, token: string): void {
    user.token = token;
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('authToken', token);
    this.currentUserSubject.next(user);
    
    console.log('✅ Usuario autenticado:', user.nombre, 'Rol:', user.rol_id === 1 ? 'Admin' : 'Usuario');
  }

  // Logout
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
    this.playerService.stop();
    this.playerService.reset();
    this.router.navigate(['/login']);
    console.log('👋 Usuario desconectado');
  }

  // Actualizar datos del usuario
  updateUser(user: Usuario): void {
    const currentToken = localStorage.getItem('authToken');
    if (currentToken) {
      user.token = currentToken;
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // Obtener token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Verificar permisos específicos
  hasPermission(requiredRole: number): boolean {
    const userRole = this.getUserRole();
    if (!userRole) return false;
    
    // Admin (1) tiene acceso a todo
    if (userRole === 1) return true;
    
    // Verificar rol específico
    return userRole === requiredRole;
  }

  saveAuthData(token: string, user: Usuario): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

}