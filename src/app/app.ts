import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MusicPlayerComponent } from './pages/shared/components/reproductor-component/reproductor-component';
import { PwaService } from './pages/shared/services/pwa-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MusicPlayerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('soundblitz');

  constructor(private pwaService: PwaService) {}

  ngOnInit(): void {
    // Inicializar PWA
    this.pwaService.initPwaPrompt();
    
    // Detectar cambios de conexión
    window.addEventListener('online', () => {
      console.log('🌐 Conexión restaurada');
    });

    window.addEventListener('offline', () => {
      console.log('📡 Modo offline activado');
    });
  }
}
