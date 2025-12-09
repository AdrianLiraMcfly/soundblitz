import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiServices } from '../../shared/services/api-services';
import { AuthService, Usuario } from '../../shared/services/auth-service';
import { RecaptchaService } from '../../shared/services/recaptcha-service';

@Component({
  selector: 'app-login-component',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css'
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };

  isLoading = false;
  showPassword = false;
  errorMessage = '';
  showError = false;
  
  // ✅ Para reCAPTCHA v2
  private recaptchaWidgetId: number | null = null;
  private recaptchaToken: string = '';

  constructor(
    private router: Router,
    private apiServices: ApiServices,
    private authService: AuthService,
    private recaptchaService: RecaptchaService
  ) {}

  ngOnInit(): void {
    this.checkExistingAuth();
  }

  ngAfterViewInit(): void {
    // ✅ Renderizar reCAPTCHA v2 después de que la vista esté lista
    this.recaptchaService.waitForRecaptchaLoad()
      .then(() => {
        this.recaptchaWidgetId = this.recaptchaService.renderRecaptcha(
          'recaptcha-container',
          (token) => {
            this.recaptchaToken = token;
            //console.log('✅ reCAPTCHA v2 completado');
          }
        );
      })

    // Auto-completar email si se guardó
    const rememberUser = localStorage.getItem('rememberUser');
    const savedEmail = localStorage.getItem('userEmail');
    
    if (rememberUser === 'true' && savedEmail) {
      this.loginData.email = savedEmail;
      this.loginData.rememberMe = true;
    }
  }

  ngOnDestroy(): void {
    // Limpiar si es necesario
  }

  private checkExistingAuth(): void {
    if (this.authService.isAuthenticated()) {
      //console.log('✅ Usuario ya autenticado, redirigiendo...');
      const isAdmin = this.authService.isAdmin();
      
      if (isAdmin) {
        this.router.navigate(['/admin/canciones']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  // ✅ Login con validación de reCAPTCHA v2
  onLogin(): void {
    // Validar reCAPTCHA
    if (!this.recaptchaToken) {
      this.showErrorMessage('Por favor, completa el reCAPTCHA');
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.hideError();

    const credentials = {
      email: this.loginData.email.trim(),
      password: this.loginData.password,
      recaptchaToken: this.recaptchaToken
    };

    //console.log('🔐 Intentando login con:', credentials.email);

    this.apiServices.login(credentials).subscribe({
      next: (response) => {
        //console.log('📥 Respuesta del servidor:', response);
        this.handleLoginSuccess(response);
      },
      error: (error) => {
        //console.error('❌ Error en login:', error);
        this.handleLoginError(error);
        this.isLoading = false;
        // ✅ Resetear reCAPTCHA después de error
        this.recaptchaService.resetRecaptcha(this.recaptchaWidgetId);
        this.recaptchaToken = '';
      },
    });
  }

  private handleLoginSuccess(response: any): void {
    try {
      //console.log('✅ Credenciales correctas, código enviado por email');
      
      if (this.loginData.rememberMe) {
        localStorage.setItem('rememberUser', 'true');
        localStorage.setItem('userEmail', this.loginData.email.trim());
      }

      this.isLoading = false;

      this.router.navigate(['/verify-code'], {
        state: { email: this.loginData.email.trim() }
      });

    } catch (error: any) {
      console.error('❌ Error procesando respuesta:', error);
      this.showErrorMessage(error.message || 'Error al procesar la respuesta');
      this.isLoading = false;
    }
  }

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

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goRegister(): void {
    this.router.navigate(['/register']);
  }

  goForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;

    setTimeout(() => {
      this.hideError();
    }, 5000);
  }

  private hideError(): void {
    this.showError = false;
    this.errorMessage = '';
  }
}