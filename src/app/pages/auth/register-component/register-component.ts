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
  showSuccess = false;
  successMessage = '';
  
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
    this.hideSuccess();

    // ✅ Formato según la API del backend: {nombre, email, password, rol}
    const userData = {
      nombre: this.registerData.nombre.trim(),
      email: this.registerData.email.trim(),
      password: this.registerData.password,
      rol: 2, // ✅ Usuario regular (no administrador)
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
    this.showSuccessMessage('¡Registro exitoso! Redirigiendo al login...');
    
    // Esperar 2 segundos antes de redirigir
    setTimeout(() => {
      this.router.navigate(['/login'], {
        state: { 
          email: this.registerData.email,
          message: 'Registro exitoso. Por favor, inicia sesión.' 
        }
      });
    }, 2000);
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
    // Validar nombre (mínimo 3 caracteres)
    if (!this.registerData.nombre.trim()) {
      this.showErrorMessage('El nombre es requerido');
      return false;
    }

    if (this.registerData.nombre.trim().length < 3) {
      this.showErrorMessage('El nombre debe tener al menos 3 caracteres');
      return false;
    }

    // Validar email
    if (!this.registerData.email.trim()) {
      this.showErrorMessage('El email es requerido');
      return false;
    }

    if (!this.isValidEmail(this.registerData.email)) {
      this.showErrorMessage('El formato del email no es válido');
      return false;
    }

    // Validar contraseña (mínimo 6 caracteres, al menos una letra y un número)
    if (!this.registerData.password) {
      this.showErrorMessage('La contraseña es requerida');
      return false;
    }

    if (this.registerData.password.length < 6) {
      this.showErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!this.isValidPassword(this.registerData.password)) {
      this.showErrorMessage('La contraseña debe contener al menos una letra y un número');
      return false;
    }

    // Validar coincidencia de contraseñas
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

  private isValidPassword(password: string): boolean {
    // Al menos una letra y un número
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLetter && hasNumber;
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

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.showSuccess = true;
  }

  private hideSuccess(): void {
    this.showSuccess = false;
    this.successMessage = '';
  }
}