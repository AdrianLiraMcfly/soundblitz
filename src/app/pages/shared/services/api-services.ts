import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../shared/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiServices {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Headers con token de autenticación
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // ===== USUARIOS =====
  // GET /api/usuarios - Obtener todos los usuarios
  getUsuarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // POST /api/usuarios - Crear usuario
  crearUsuario(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, userData);
  }

  // PUT /api/usuarios/:id - Actualizar usuario
  actualizarUsuario(id: string, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, userData, { 
      headers: this.getAuthHeaders() 
    });
  }

  // DELETE /api/usuarios/:id - Eliminar usuario
  eliminarUsuario(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // PUT /api/usuarios/reset_password/:id - Resetear contraseña
  resetPassword(id: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/reset_password/${id}`, 
      { password: newPassword }, 
      { headers: this.getAuthHeaders() }
    );
  }

  // POST /api/usuarios/login - Login
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/login`, credentials);
  }

  // ===== CANCIONES =====
  // GET /api/canciones - Obtener todas las canciones
  getCanciones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/canciones`, { headers: this.getAuthHeaders() });
  }

  // POST /api/canciones - Crear canción
  crearCancion(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/canciones`, data, { 
      headers: this.getAuthHeaders() 
    });
  }

crearCancionFormData(formData: FormData): Observable<any> {

  return this.http.post(`${this.apiUrl}/canciones`, formData, { 
    headers: this.getAuthHeaders()
  });
}

  // PUT /api/canciones/:id - Actualizar canción
  actualizarCancion(id: string, songData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/canciones/${id}`, songData, { 
      headers: this.getAuthHeaders() 
    });
  }

  // DELETE /api/canciones/:id - Eliminar canción
  eliminarCancion(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/canciones/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // ===== CANCIONES QR =====
  // GET /api/canciones_qr - Obtener canciones QR
  getCancionesQR(): Observable<any> {
    return this.http.get(`${this.apiUrl}/canciones_qr`);
  }

  buscarCancionDeezer(query: string): Observable<any> {
    const apiUrl = `/api/search?q=${encodeURIComponent(query)}`;
    return this.http.get(apiUrl);
  }

  // POST /api/canciones_qr - Crear canción QR
  crearCancionQR(qrData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/canciones_qr`, qrData, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Buscar canción por código QR
  buscarCancionPorQR(qrCode: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/canciones_qr?qrCode=${qrCode}`);
  }

  // ===== ÁLBUMES =====
  // GET /api/albumes - Obtener todos los álbumes
  getAlbumes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/albumes`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // POST /api/albumes - Crear álbum
  crearAlbum(albumData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/albumes`, albumData, { 
      headers: this.getAuthHeaders() 
    });
  }

  // PUT /api/albumes/:id - Actualizar álbum
  actualizarAlbum(id: string, albumData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/albumes/${id}`, albumData, { 
      headers: this.getAuthHeaders() 
    });
  }

  // DELETE /api/albumes/:id - Eliminar álbum
  eliminarAlbum(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/albumes/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // ===== ARTISTAS =====
  // GET /api/artistas - Obtener todos los artistas
  getArtistas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/artistas`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // POST /api/artistas - Crear artista
  crearArtista(artistData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/artistas`, artistData, { 
      headers: this.getAuthHeaders() 
    });
  }

  // PUT /api/artistas/:id - Actualizar artista
  actualizarArtista(id: string, artistData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/artistas/${id}`, artistData, { 
      headers: this.getAuthHeaders() 
    });
  }

  // DELETE /api/artistas/:id - Eliminar artista
  eliminarArtista(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/artistas/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // ===== FAVORITOS =====
  // GET /api/favoritas - Obtener favoritas del usuario
  getFavoritas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/favoritas`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // POST /api/favoritas - Agregar favorita
  agregarFavorita(songId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/favoritas`, 
      { songId }, 
      { headers: this.getAuthHeaders() }
    );
  }

  // DELETE /api/favoritas/:id - Eliminar favorita
  eliminarFavorita(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/favoritas/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // ===== ROLES =====
  // GET /api/roles - Obtener todos los roles
  getRoles(): Observable<any> {
    return this.http.get(`${this.apiUrl}/roles`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // POST /api/roles - Crear rol
  crearRol(roleData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/roles`, roleData, { 
      headers: this.getAuthHeaders() 
    });
  }

  // PUT /api/roles/:id - Actualizar rol
  actualizarRol(id: string, roleData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/roles/${id}`, roleData, { 
      headers: this.getAuthHeaders() 
    });
  }

  // DELETE /api/roles/:id - Eliminar rol
  eliminarRol(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/roles/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // ===== MÉTODOS ADICIONALES PARA EL DASHBOARD =====
  
  // Buscar contenido general
  buscarContenido(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }

  // Obtener recomendaciones personalizadas
  getRecomendaciones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/recomendaciones`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Obtener contenido popular/trending
  getTrendingContent(): Observable<any> {
    return this.http.get(`${this.apiUrl}/trending`);
  }

  // Obtener historial de reproducción
  getHistorialReproduccion(): Observable<any> {
    return this.http.get(`${this.apiUrl}/historial`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Registrar reproducción de canción
  registrarReproduccion(songId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reproducir`, 
      { songId }, 
      { headers: this.getAuthHeaders() }
    );
  }

  // ===== UTILIDADES =====
  
  // Verificar si token es válido
  verificarToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify-token`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // GET /api/usuarios/me - Obtener datos del usuario actual por email
  me(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios/me?email=${encodeURIComponent(email)}`, {
      headers: this.getAuthHeaders() 
    });
  }


// Logout
logout(): Observable<any> {
  return this.http.post(`${this.apiUrl}/usuarios/logout`, {}, {
    headers: this.getAuthHeaders()
  });
}

  // Método para limpiar token local
  clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }

  // Método para guardar token
  saveAuthData(token: string, userData: any): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  // Método para obtener datos del usuario actual
  getCurrentUser(): any {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  // Example API call (método original)
  getData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/data`);
  }
}