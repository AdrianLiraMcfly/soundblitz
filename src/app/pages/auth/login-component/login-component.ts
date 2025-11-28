import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiServices } from '../../shared/services/api-services';
import { AuthService, Usuario } from '../../shared/services/auth-service';

@Component({
  selector: 'app-login-component',
  imports: [FormsModule, CommonModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css'
})
export class LoginComponent {
  // Datos del formulario
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };

  // Estados del componente
  isLoading = false;
  showPassword = false;
  errorMessage = '';
  showError = false;

  constructor(
    private router: Router,
    private apiServices: ApiServices,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Verificar si ya está logueado
    this.checkExistingAuth();
  }

  // Verificar si ya hay una sesión activa
  private checkExistingAuth(): void {
    if (this.authService.isAuthenticated()) {
      console.log('✅ Usuario ya autenticado, redirigiendo...');
      const isAdmin = this.authService.isAdmin();
      
      if (isAdmin) {
        this.router.navigate(['/admin/canciones']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  // Método para manejar el login
  onLogin(): void {
    // Validar campos
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.hideError();

    const credentials = {
      email: this.loginData.email.trim(),
      password: this.loginData.password
    };

    console.log('🔐 Intentando login con:', credentials.email);

    this.apiServices.login(credentials).subscribe({
      next: (response) => {
        console.log('📥 Respuesta del servidor:', response);
        this.handleLoginSuccess(response);
      },
      error: (error) => {
        console.error('❌ Error en login:', error);
        this.handleLoginError(error);
        this.isLoading = false;
      },
    });
  }

  // Manejar login exitoso
  private handleLoginSuccess(response: any): void {
    try {
      // ✅ Extraer datos del response
      const token = response.data?.token || response.token;
      const usuarioData = response.data?.usuario || response.usuario || response.data;

      console.log('📋 Datos extraídos:');
      console.log('   Token:', token ? 'Existe' : 'No existe');
      console.log('   Usuario raw:', usuarioData);

      if (!token) {
        throw new Error('No se recibió token de autenticación');
      }

      if (!usuarioData) {
        throw new Error('No se recibieron datos del usuario');
      }

      // ✅ Crear objeto de usuario con rol_id como NÚMERO
      const usuario: Usuario = {
        id: Number(usuarioData.id),
        nombre: usuarioData.nombre || usuarioData.name || 'Usuario',
        email: usuarioData.email || this.loginData.email,
        rol_id: Number(usuarioData.rol_id || usuarioData.role_id || usuarioData.rol || 2)
      };

      console.log('👤 Usuario procesado:', usuario);
      console.log('🎭 rol_id:', usuario.rol_id, 'tipo:', typeof usuario.rol_id);
      console.log('👑 ¿Es admin?:', usuario.rol_id === 1);

      // ✅ Guardar en AuthService
      this.authService.login(usuario, token);

      // Recordar usuario si está marcado
      if (this.loginData.rememberMe) {
        localStorage.setItem('rememberUser', 'true');
        localStorage.setItem('userEmail', this.loginData.email.trim());
      }

      // Mostrar mensaje de éxito
      this.showSuccessMessage(usuario);

      // ✅ Redirigir según el rol
      setTimeout(() => {
        this.isLoading = false;
        
        if (usuario.rol_id === 1) {
          console.log('🚀 Redirigiendo a panel de admin...');
          this.router.navigate(['/dashboard']);
        } else {
          console.log('🚀 Redirigiendo a dashboard...');
          this.router.navigate(['/dashboard']);
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error procesando respuesta:', error);
      this.showErrorMessage(error.message || 'Error al procesar la respuesta del servidor');
      this.isLoading = false;
    }
  }

  // Manejar errores de login
  private handleLoginError(error: any): void {
    let errorMsg = 'Error al iniciar sesión';

    if (error.status === 401) {
      errorMsg = 'Email o contraseña incorrectos';
    } else if (error.status === 404) {
      errorMsg = 'Usuario no encontrado';
    } else if (error.status === 403) {
      errorMsg = 'Cuenta bloqueada o inactiva';
    } else if (error.status === 0) {
      errorMsg = 'Error de conexión. Verifica tu internet';
    } else if (error.error?.message) {
      errorMsg = error.error.message;
    }

    this.showErrorMessage(errorMsg);
  }

  // Validar formulario
  private validateForm(): boolean {
    if (!this.loginData.email.trim()) {
      this.showErrorMessage('El email es requerido');
      return false;
    }

    if (!this.loginData.password.trim()) {
      this.showErrorMessage('La contraseña es requerida');
      return false;
    }

    if (this.loginData.email.includes('@') && !this.isValidEmail(this.loginData.email)) {
      this.showErrorMessage('El formato del email no es válido');
      return false;
    }

    if (this.loginData.password.length < 6) {
      this.showErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    return true;
  }

  // Validar formato de email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Mostrar/ocultar contraseña
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Navegación al registro
  goRegister(): void {
    this.router.navigate(['/register']);
  }

  // Navegación a recuperar contraseña
  goForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  // Métodos para manejar mensajes
  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;

    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
      this.hideError();
    }, 5000);
  }

  private hideError(): void {
    this.showError = false;
    this.errorMessage = '';
  }

  private showSuccessMessage(usuario: Usuario): void {
    const rolText = usuario.rol_id === 1 ? 'Administrador' : 'Usuario';
    console.log(`✅ Bienvenido ${usuario.nombre} (${rolText})`);
  }


  // Auto-completar email si se recordó al usuario
  ngAfterViewInit(): void {
    const rememberUser = localStorage.getItem('rememberUser');
    const savedEmail = localStorage.getItem('userEmail');
    
    if (rememberUser === 'true' && savedEmail) {
      this.loginData.email = savedEmail;
      this.loginData.rememberMe = true;
    }
  }
}