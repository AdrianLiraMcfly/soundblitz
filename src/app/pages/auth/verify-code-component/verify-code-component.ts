import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiServices } from '../../shared/services/api-services';
import { AuthService, Usuario } from '../../shared/services/auth-service';
import { RecaptchaService } from '../../shared/services/recaptcha-service';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './verify-code-component.html',
  styleUrl: './verify-code-component.css'
})
export class VerifyCodeComponent implements OnInit, AfterViewInit, OnDestroy {
  verifyData = {
    code: '',
    email: ''
  };

  isLoading = false;
  errorMessage = '';
  showError = false;
  countdown = 60;
  canResend = false;
  private countdownInterval: any;
  
  // ✅ Para reCAPTCHA v2
  private recaptchaWidgetId: number | null = null;
  private recaptchaToken: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiServices: ApiServices,
    private authService: AuthService,
    private recaptchaService: RecaptchaService
  ) {}

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;
    
    this.verifyData.email = state?.['email'] || '';
    
    if (!this.verifyData.email) {
      console.error('❌ No se recibió email, redirigiendo a login');
      this.router.navigate(['/login']);
      return;
    }

    console.log('📧 Email recibido:', this.verifyData.email);
    this.startCountdown();
  }

  ngAfterViewInit(): void {
    // ✅ Renderizar reCAPTCHA v2
    this.recaptchaService.waitForRecaptchaLoad()
      .then(() => {
        this.recaptchaWidgetId = this.recaptchaService.renderRecaptcha(
          'recaptcha-container-verify',
          (token) => {
            this.recaptchaToken = token;
            console.log('✅ reCAPTCHA v2 completado en verify-code');
          }
        );
      })
      .catch(err => console.error('❌ Error cargando reCAPTCHA:', err));
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  // ✅ Verificar código con reCAPTCHA v2
  onVerifyCode(): void {
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

    console.log('🔐 Verificando código con reCAPTCHA');

    this.apiServices.validarCode(this.verifyData.code.trim(), this.verifyData.email).subscribe({
      next: (response) => {
        console.log('✅ Código verificado:', response);
        this.handleVerifySuccess(response);
      },
      error: (error) => {
        console.error('❌ Error al verificar código:', error);
        this.handleVerifyError(error);
        this.isLoading = false;
        // ✅ Resetear reCAPTCHA después de error
        this.recaptchaService.resetRecaptcha(this.recaptchaWidgetId);
        this.recaptchaToken = '';
      }
    });
  }

  private handleVerifySuccess(response: any): void {
    try {
      const token = response.data?.token || response.token;
      const usuarioData = response.data?.usuario || response.usuario || response.data;

      if (!token || !usuarioData) {
        throw new Error('Datos de autenticación incompletos');
      }

      const usuario: Usuario = {
        id: Number(usuarioData.id),
        nombre: usuarioData.nombre || 'Usuario',
        email: usuarioData.email || this.verifyData.email,
        rol_id: Number(usuarioData.rol_id || 2)
      };

      console.log('👤 Usuario verificado:', usuario);
      this.authService.login(usuario, token);

      setTimeout(() => {
        this.isLoading = false;
        
        if (usuario.rol_id === 1) {
          console.log('🚀 Redirigiendo a panel de admin...');
          this.router.navigate(['/admin/canciones']);
        } else {
          console.log('🚀 Redirigiendo a dashboard...');
          this.router.navigate(['/dashboard']);
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error procesando respuesta:', error);
      this.showErrorMessage(error.message || 'Error al procesar la respuesta');
      this.isLoading = false;
    }
  }

  private handleVerifyError(error: any): void {
    let errorMsg = 'Error al verificar el código';

    if (error.status === 401) {
      errorMsg = 'Código incorrecto o expirado';
    } else if (error.status === 0) {
      errorMsg = 'Error de conexión. Verifica tu internet';
    } else if (error.error?.message) {
      errorMsg = error.error.message;
    }

    this.showErrorMessage(errorMsg);
  }

  onResendCode(): void {
    if (!this.canResend) return;

    console.log('🔄 Reenviando código a:', this.verifyData.email);

    // TODO: Implementar endpoint backend para reenviar código
    setTimeout(() => {
      this.isLoading = false;
      this.showSuccessMessage('Código reenviado correctamente');
      this.resetCountdown();
    }, 1500);
  }

  goBack(): void {
    this.router.navigate(['/login']);
  }

  private validateForm(): boolean {
    if (!this.verifyData.code.trim()) {
      this.showErrorMessage('El código es requerido');
      return false;
    }

    if (this.verifyData.code.trim().length !== 6) {
      this.showErrorMessage('El código debe tener 6 caracteres');
      return false;
    }

    return true;
  }

  private startCountdown(): void {
    this.countdown = 60;
    this.canResend = false;

    this.countdownInterval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        this.canResend = true;
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  private resetCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.startCountdown();
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
    console.log(`✅ ${message}`);
  }

  onCodeInput(event: any): void {
    const value = event.target.value;
    if (value.length > 6) {
      this.verifyData.code = value.substring(0, 6);
    }
  }
}