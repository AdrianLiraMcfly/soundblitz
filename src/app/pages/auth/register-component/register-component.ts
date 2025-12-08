import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiServices } from '../../shared/services/api-services';
import { RecaptchaService } from '../../shared/services/recaptcha-service';

@Component({
  selector: 'app-register-component',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register-component.html',
  styleUrl: './register-component.css'
})
export class RegisterComponent implements OnInit, AfterViewInit, OnDestroy {
  registerData = {
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  showError = false;
  
  // ✅ Para reCAPTCHA v2
  private recaptchaWidgetId: number | null = null;
  private recaptchaToken: string = '';

  constructor(
    private router: Router,
    private apiServices: ApiServices,
    private recaptchaService: RecaptchaService
  ) {}

  ngOnInit(): void {
    // Esperar a que reCAPTCHA se cargue
  }

  ngAfterViewInit(): void {
    // ✅ Renderizar reCAPTCHA v2
    this.recaptchaService.waitForRecaptchaLoad()
      .then(() => {
        this.recaptchaWidgetId = this.recaptchaService.renderRecaptcha(
          'recaptcha-container-register',
          (token) => {
            this.recaptchaToken = token;
            console.log('✅ reCAPTCHA v2 completado en register');
          }
        );
      })
      .catch(err => console.error('❌ Error cargando reCAPTCHA:', err));
  }

  ngOnDestroy(): void {
    // Limpiar si es necesario
  }

  // ✅ Registrar con reCAPTCHA v2
  onRegister(): void {
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

    const userData = {
      nombre: this.registerData.nombre.trim(),
      email: this.registerData.email.trim(),
      password: this.registerData.password,
      recaptchaToken: this.recaptchaToken
    };

    console.log('📝 Registrando usuario:', userData.email);

    this.apiServices.crearUsuario(userData).subscribe({
      next: (response) => {
        console.log('✅ Usuario registrado:', response);
        this.handleRegisterSuccess();
      },
      error: (error) => {
        console.error('❌ Error en registro:', error);
        this.handleRegisterError(error);
        this.isLoading = false;
        // ✅ Resetear reCAPTCHA después de error
        this.recaptchaService.resetRecaptcha(this.recaptchaWidgetId);
        this.recaptchaToken = '';
      }
    });
  }

  private handleRegisterSuccess(): void {
    this.isLoading = false;
    this.router.navigate(['/login'], {
      state: { message: 'Registro exitoso. Por favor, inicia sesión.' }
    });
  }

  private handleRegisterError(error: any): void {
    let errorMsg = 'Error al registrar usuario';

    if (error.status === 409) {
      errorMsg = 'El email ya está registrado';
    } else if (error.status === 400) {
      errorMsg = 'Datos inválidos. Verifica los campos.';
    } else if (error.error?.message) {
      errorMsg = error.error.message;
    }

    this.showErrorMessage(errorMsg);
  }

  private validateForm(): boolean {
    if (!this.registerData.nombre.trim()) {
      this.showErrorMessage('El nombre es requerido');
      return false;
    }

    if (!this.registerData.email.trim()) {
      this.showErrorMessage('El email es requerido');
      return false;
    }

    if (!this.isValidEmail(this.registerData.email)) {
      this.showErrorMessage('El formato del email no es válido');
      return false;
    }

    if (!this.registerData.password) {
      this.showErrorMessage('La contraseña es requerida');
      return false;
    }

    if (this.registerData.password.length < 6) {
      this.showErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.showErrorMessage('Las contraseñas no coinciden');
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

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goLogin(): void {
    this.router.navigate(['/login']);
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