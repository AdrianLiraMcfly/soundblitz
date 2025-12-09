// src/app/pages/auth/login-component/login-component.ts - ACTUALIZADO
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiServices } from '../../shared/services/api-services';
import { AuthService, Usuario } from '../../shared/services/auth-service';
import { RecaptchaService } from '../../shared/services/recaptcha-service';
import { PwaInstallService } from '../../shared/services/pwa-install.service';
import { Subscription } from 'rxjs';

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
  
  // PWA Installation
  showInstallPrompt = false;
  isInstallingPWA = false;
  platformInfo: any = {};
  showIOSInstructions = false;
  private installSubscription?: Subscription;
  
  // reCAPTCHA
  private recaptchaWidgetId: number | null = null;
  private recaptchaToken: string = '';

  constructor(
    private router: Router,
    private apiServices: ApiServices,
    private authService: AuthService,
    private recaptchaService: RecaptchaService,
    private pwaInstallService: PwaInstallService
  ) {}

  ngOnInit(): void {
    this.checkExistingAuth();
    this.checkPWAInstallability();
  }

  ngAfterViewInit(): void {
    this.recaptchaService.waitForRecaptchaLoad()
      .then(() => {
        this.recaptchaWidgetId = this.recaptchaService.renderRecaptcha(
          'recaptcha-container',
          (token) => {
            this.recaptchaToken = token;
          }
        );
      });

    const rememberUser = localStorage.getItem('rememberUser');
    const savedEmail = localStorage.getItem('userEmail');
    
    if (rememberUser === 'true' && savedEmail) {
      this.loginData.email = savedEmail;
      this.loginData.rememberMe = true;
    }
  }

  ngOnDestroy(): void {
    this.installSubscription?.unsubscribe();
  }

  private checkExistingAuth(): void {
    if (this.authService.isAuthenticated()) {
      const isAdmin = this.authService.isAdmin();
      
      if (isAdmin) {
        this.router.navigate(['/admin/canciones']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  private checkPWAInstallability(): void {
    this.platformInfo = this.pwaInstallService.getPlatformInfo();
    this.showInstallPrompt = this.pwaInstallService.shouldShowInstallButton();

    // Suscribirse a cambios en la disponibilidad de instalación
    this.installSubscription = this.pwaInstallService.canInstall.subscribe(canInstall => {
      if (canInstall && this.platformInfo.isAndroid) {
        this.showInstallPrompt = true;
      }
    });

    //console.log('PWA Info:', this.platformInfo, 'Show Install:', this.showInstallPrompt);
  }

  async installPWA(): Promise<void> {
    // Para iOS, mostrar instrucciones
    if (this.platformInfo.isIOS) {
      this.showIOSInstructions = true;
      return;
    }

    // Para Android con prompt nativo
    if (this.platformInfo.isAndroid && this.platformInfo.canInstall) {
      this.isInstallingPWA = true;
      const installed = await this.pwaInstallService.promptInstall();
      
      if (installed) {
        this.showInstallPrompt = false;
        setTimeout(() => {
          alert('SoundBlitz instalado correctamente\n\nPuedes encontrar la aplicación en tu pantalla de inicio.');
        }, 1000);
      }
      
      this.isInstallingPWA = false;
    }
  }

  closeIOSInstructions(): void {
    this.showIOSInstructions = false;
  }

  dismissInstallPrompt(): void {
    this.showInstallPrompt = false;
    localStorage.setItem('pwa-install-dismissed', 'true');
  }

onLogin(): void {
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

  this.apiServices.login(credentials).subscribe({
    next: (response) => {
      console.log('📥 Respuesta del login:', response);
      
      if (response.success) {
        if (this.loginData.rememberMe) {
          localStorage.setItem('rememberUser', 'true');
          localStorage.setItem('userEmail', this.loginData.email);
        } else {
          localStorage.removeItem('rememberUser');
          localStorage.removeItem('userEmail');
        }
        
        this.isLoading = false;
        
        // Redirigir a verify-code con el email
        this.router.navigate(['/verify-code'], {
          state: { 
            email: this.loginData.email,
            message: response.message || 'Código enviado a tu email'
          }
        });
      } else {
        // Credenciales incorrectas
        this.showErrorMessage(response.message || 'Credenciales incorrectas');
        this.resetRecaptcha();
        this.isLoading = false;
      }
    },
    error: (error) => {
      const errorMsg = error.error?.message || 'Error de conexión. Inténtalo de nuevo.';
      this.showErrorMessage(errorMsg);
      this.resetRecaptcha();
      this.isLoading = false;
    }
  });
}
  private validateForm(): boolean {
    if (!this.loginData.email.trim()) {
      this.showErrorMessage('Por favor, introduce tu email o nombre de usuario');
      return false;
    }

    if (!this.loginData.password) {
      this.showErrorMessage('Por favor, introduce tu contraseña');
      return false;
    }

    if (this.loginData.password.length < 6) {
      this.showErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    return true;
  }

  private resetRecaptcha(): void {
    if (this.recaptchaWidgetId !== null) {
      this.recaptchaService.resetRecaptcha(this.recaptchaWidgetId);
      this.recaptchaToken = '';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
    setTimeout(() => this.hideError(), 5000);
  }

  private hideError(): void {
    this.showError = false;
  }

  goRegister(): void {
    this.router.navigate(['/register']);
  }

  goForgotPassword(): void {
    alert('Funcionalidad de recuperación de contraseña en desarrollo');
  }
}