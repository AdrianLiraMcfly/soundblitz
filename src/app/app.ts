import { Component, signal, OnInit, OnDestroy} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './pages/shared/services/auth-service';
import { MusicPlayerComponent } from './pages/shared/components/reproductor-component/reproductor-component';
import { PwaService } from './pages/shared/services/pwa-service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MusicPlayerComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('soundblitz');
  isAuthenticated: boolean = false;
  private authSubscription?: Subscription | null = null;
  constructor(private pwaService: PwaService, private authService: AuthService) {}

  ngOnInit(): void {
    // Inicializar PWA
    this.pwaService.initPwaPrompt();

    // Suscribirse a cambios de autenticación
    this.authSubscription = this.authService.currentUser$.subscribe(
      (user) => {
        this.isAuthenticated = !!user;
      }
    );

    // Detectar cambios de conexión
    window.addEventListener('online', () => {
      console.log('🌐 Conexión restaurada');
    });

    window.addEventListener('offline', () => {
      console.log('📡 Modo offline activado');
    });
  }

  ngOnDestroy(): void {
    // Cleanup logic here
    this.authSubscription?.unsubscribe();
  }
}
