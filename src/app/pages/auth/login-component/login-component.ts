import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiServices } from '../../shared/services/api-services';

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
    private apiServices: ApiServices
  ) {}

  ngOnInit(): void {
    // Verificar si ya está logueado
    this.checkExistingAuth();
  }

  // Verificar si ya hay una sesión activa
  private checkExistingAuth(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verificar si el token es válido
      this.apiServices.verificarToken().subscribe({
        next: (response) => {
          if (response.valid) {
            this.router.navigate(['/dashboard']);
          }
        },
        error: () => {
          // Token inválido, limpiar datos
          this.apiServices.clearAuthData();
        }
      });
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

    this.apiServices.login(credentials).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        
        // Guardar datos de autenticación
        this.handleLoginSuccess(response);
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.handleLoginError(error);
        this.isLoading = false;
      },
    });
  }

  // Manejar login exitoso
  private handleLoginSuccess(response: any): void {
    // Guardar token y datos del usuario
    const token = response.data.token;
    const userData = response.data.email;

    if (token) {
      this.apiServices.saveAuthData(token, userData);

      // Recordar usuario si está marcado
      if (this.loginData.rememberMe) {
        localStorage.setItem('rememberUser', 'true');
        localStorage.setItem('userEmail', this.loginData.email.trim());
      }

      // Mostrar mensaje de éxito
      this.showSuccessMessage();

      // Navegar al dashboard después de un breve delay
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1000);
    } else {
      this.showErrorMessage('Respuesta de servidor inválida');
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

  private showSuccessMessage(): void {
    // Aquí podrías mostrar un toast de éxito
    console.log('Login exitoso - Redirigiendo...');
  }

  // Login con redes sociales (placeholder)
  loginWithGoogle(): void {
    console.log('Login con Google - Por implementar');
    // Aquí implementarías la autenticación con Google
  }

  loginWithFacebook(): void {
    console.log('Login con Facebook - Por implementar');
    // Aquí implementarías la autenticación con Facebook
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