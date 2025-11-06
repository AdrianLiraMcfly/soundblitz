import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService, Cancion } from '../../services/playing-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-music-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reproductor-component.html',
  styleUrl: './reproductor-component.css'
})
export class MusicPlayerComponent implements OnInit, OnDestroy {
  currentSong: Cancion | null = null;
  isPlaying: boolean = false;
  currentTime: number = 0;
  duration: number = 0;
  volume: number = 0.7;
  isMuted: boolean = false;
  showVolumeSlider: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(private playerService: PlayerService) {}

  ngOnInit(): void {
    // Suscribirse a los cambios del reproductor
    this.subscriptions.push(
      this.playerService.currentSong$.subscribe(song => {
        this.currentSong = song;
      }),
      
      this.playerService.isPlaying$.subscribe(playing => {
        this.isPlaying = playing;
      }),
      
      this.playerService.currentTime$.subscribe(time => {
        this.currentTime = time;
      }),
      
      this.playerService.duration$.subscribe(duration => {
        this.duration = duration;
      })
    );
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Control de reproducción
  togglePlayPause(): void {
    this.playerService.togglePlayPause();
  }

  playNext(): void {
    this.playerService.next();
  }

  playPrevious(): void {
    this.playerService.previous();
  }

  // Control de progreso
  onProgressClick(event: MouseEvent): void {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const time = percent * this.duration;
    this.playerService.seek(time);
  }

  get progressPercent(): number {
    if (!this.duration) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  // Control de volumen
  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.playerService.setVolume(this.isMuted ? 0 : this.volume);
  }

  onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.volume = parseFloat(input.value);
    this.isMuted = this.volume === 0;
    this.playerService.setVolume(this.volume);
  }

  toggleVolumeSlider(): void {
    this.showVolumeSlider = !this.showVolumeSlider;
  }

  // Utilidades
  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getVolumeIcon(): string {
    if (this.isMuted || this.volume === 0) {
      return 'M5.889 16H2a1 1 0 01-1-1V9a1 1 0 011-1h3.889l5.294-4.332a.5.5 0 01.817.387v15.89a.5.5 0 01-.817.387L5.89 16zm14.384-8.42l-1.768 1.768a4 4 0 010 4.243l1.768 1.768a6.5 6.5 0 000-7.779zm-3.536 3.536a2 2 0 000 2.828l1.768-1.768a4 4 0 000-2.828l-1.768 1.768z';
    } else if (this.volume < 0.5) {
      return 'M5.889 16H2a1 1 0 01-1-1V9a1 1 0 011-1h3.889l5.294-4.332a.5.5 0 01.817.387v15.89a.5.5 0 01-.817.387L5.89 16zm8.444-8.343l1.768 1.768a4 4 0 010 5.657l-1.768 1.768a6.5 6.5 0 000-9.193z';
    } else {
      return 'M5.889 16H2a1 1 0 01-1-1V9a1 1 0 011-1h3.889l5.294-4.332a.5.5 0 01.817.387v15.89a.5.5 0 01-.817.387L5.89 16zm14.384-8.42l-1.768 1.768a4 4 0 010 4.243l1.768 1.768a6.5 6.5 0 000-7.779zm-3.536 3.536a2 2 0 000 2.828l1.768-1.768a4 4 0 000-2.828l-1.768 1.768z';
    }
  }
}