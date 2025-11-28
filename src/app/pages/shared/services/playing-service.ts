import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Cancion {
  id: any;
  nombre: string;
  artista_id?: any;
  artistaNombre?: string;
  album_id?: any;
  albumNombre?: string;
  url_cancion: string;
  url_portada: string;
  duracion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private currentSongSubject = new BehaviorSubject<Cancion | null>(null);
  public currentSong$: Observable<Cancion | null> = this.currentSongSubject.asObservable();

  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  public isPlaying$: Observable<boolean> = this.isPlayingSubject.asObservable();

  private audioElement: HTMLAudioElement | null = null;
  private currentTimeSubject = new BehaviorSubject<number>(0);
  public currentTime$: Observable<number> = this.currentTimeSubject.asObservable();

  private durationSubject = new BehaviorSubject<number>(0);
  public duration$: Observable<number> = this.durationSubject.asObservable();

  constructor() {
    this.initializeAudio();
  }

  private initializeAudio(): void {
    this.audioElement = new Audio();
    
    // ✅ Configuraciones importantes
    this.audioElement.crossOrigin = 'anonymous'; // Para CORS
    this.audioElement.preload = 'metadata';
    
    // Event listeners
    this.audioElement.addEventListener('loadedmetadata', () => {
      console.log('✅ Metadata cargada, duración:', this.audioElement?.duration);
      this.durationSubject.next(this.audioElement?.duration || 0);
    });

    this.audioElement.addEventListener('canplay', () => {
      console.log('✅ Audio listo para reproducir');
    });

    this.audioElement.addEventListener('timeupdate', () => {
      this.currentTimeSubject.next(this.audioElement?.currentTime || 0);
    });

    this.audioElement.addEventListener('ended', () => {
      console.log('✅ Reproducción finalizada');
      this.isPlayingSubject.next(false);
      this.next();
    });

    this.audioElement.addEventListener('play', () => {
      console.log('▶️ Reproducción iniciada');
      this.isPlayingSubject.next(true);
    });

    this.audioElement.addEventListener('pause', () => {
      console.log('⏸️ Reproducción pausada');
      this.isPlayingSubject.next(false);
    });

    // ✅ MEJORAR manejo de errores
    this.audioElement.addEventListener('error', (e) => {
      const error = this.audioElement?.error;
      console.error('❌ Error al reproducir audio:', {
        code: error?.code,
        message: error?.message,
        url: this.audioElement?.src,
        event: e
      });

      // Tipos de error
      switch (error?.code) {
        case 1: // MEDIA_ERR_ABORTED
          console.error('❌ Carga abortada por el usuario');
          break;
        case 2: // MEDIA_ERR_NETWORK
          console.error('❌ Error de red al cargar el audio');
          break;
        case 3: // MEDIA_ERR_DECODE
          console.error('❌ Error al decodificar el audio');
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          console.error('❌ Formato de audio no soportado o URL inválida');
          break;
        default:
          console.error('❌ Error desconocido');
      }
      
      this.isPlayingSubject.next(false);
    });

    // ✅ Detectar cuando se detiene la carga
    this.audioElement.addEventListener('stalled', () => {
      console.warn('⚠️ La descarga del audio se ha detenido');
    });

    this.audioElement.addEventListener('suspend', () => {
      console.warn('⚠️ Carga de audio suspendida');
    });
  }

playSong(song: Cancion): void {
  console.log('🎵 Intentando reproducir:', {
    nombre: song.nombre,
    url: song.url_cancion,
    artista: song.artistaNombre
  });
  
  // ✅ CORREGIDO: Validar que url_cancion no sea undefined/null
  if (!song.url_cancion || song.url_cancion === 'undefined' || song.url_cancion === 'null') {
    console.error('❌ No hay URL de canción válida');
    alert('Esta canción no tiene URL de reproducción');
    return;
  }

  // ✅ Convertir a string y limpiar
  const urlCancion = String(song.url_cancion).trim();
  
  console.log('🔍 URL procesada:', urlCancion);

  // ✅ Validar que la URL sea válida
  try {
    new URL(urlCancion);
  } catch (error) {
    console.error('❌ URL inválida:', urlCancion);
    alert('La URL de la canción no es válida:\n' + urlCancion);
    return;
  }

  // Si es la misma canción, solo play/pause
  const currentSong = this.currentSongSubject.value;
  if (currentSong?.id === song.id) {
    console.log('🔁 Misma canción, alternando play/pause');
    this.togglePlayPause();
    return;
  }

  // ✅ Pausar y resetear antes de cargar nueva canción
  if (this.audioElement) {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
  }

  // Nueva canción
  this.currentSongSubject.next(song);
  
  if (this.audioElement) {
    console.log('📥 Cargando audio desde:', urlCancion);
    
    // ✅ Usar la URL limpia
    this.audioElement.src = urlCancion;
    this.audioElement.load();
    
    // ✅ Esperar un poco antes de intentar reproducir
    setTimeout(() => {
      this.audioElement?.play()
        .then(() => {
          console.log('✅ Reproducción iniciada exitosamente');
          this.isPlayingSubject.next(true);
        })
        .catch(error => {
          console.error('❌ Error al iniciar reproducción:', error);
          console.error('Detalles:', {
            name: error.name,
            message: error.message,
            url: urlCancion
          });
          
          // Mensajes de error específicos
          if (error.name === 'NotAllowedError') {
            alert('El navegador bloqueó la reproducción automática. Haz click en play.');
          } else if (error.name === 'NotSupportedError') {
            alert('El formato de audio no es compatible con tu navegador.');
          } else {
            alert('No se pudo reproducir la canción. Verifica la URL:\n' + urlCancion);
          }
          
          this.isPlayingSubject.next(false);
        });
    }, 100);
  }
}

  togglePlayPause(): void {
    if (!this.audioElement) {
      console.error('❌ No hay elemento de audio');
      return;
    }

    console.log('🔄 Toggle play/pause, estado actual:', this.audioElement.paused ? 'pausado' : 'reproduciendo');

    if (this.audioElement.paused) {
      this.audioElement.play()
        .then(() => {
          console.log('▶️ Play exitoso');
          this.isPlayingSubject.next(true);
        })
        .catch(error => {
          console.error('❌ Error al reproducir:', error);
          alert('No se pudo reproducir la canción');
        });
    } else {
      this.audioElement.pause();
      console.log('⏸️ Pausado');
      this.isPlayingSubject.next(false);
    }
  }

  pause(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this.isPlayingSubject.next(false);
    }
  }

  play(): void {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play()
        .then(() => this.isPlayingSubject.next(true))
        .catch(error => console.error('Error al reproducir:', error));
    }
  }

  next(): void {
    console.log('⏭️ Siguiente canción (no implementado)');
    // TODO: Implementar lógica de siguiente canción
  }

  previous(): void {
    console.log('⏮️ Canción anterior (no implementado)');
    // TODO: Implementar lógica de canción anterior
  }

  seek(time: number): void {
    if (this.audioElement) {
      console.log('⏩ Buscando posición:', time);
      this.audioElement.currentTime = time;
    }
  }

  setVolume(volume: number): void {
    if (this.audioElement) {
      const newVolume = Math.max(0, Math.min(1, volume));
      console.log('🔊 Cambiando volumen a:', newVolume);
      this.audioElement.volume = newVolume;
    }
  }

  getCurrentSong(): Cancion | null {
    return this.currentSongSubject.value;
  }

  isPlaying(): boolean {
    return this.isPlayingSubject.value;
  }

  getCurrentTime(): number {
  return this.currentTimeSubject.value;
}

getDuration(): number {
  return this.durationSubject.value;
}

getVolume(): number {
  return this.audioElement?.volume || 0.7;
}

stop(): void {
  if (this.audioElement) {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.isPlayingSubject.next(false);
  }
}

toggleMute(): void {
  if (this.audioElement) {
    const currentVolume = this.audioElement.volume;
    this.audioElement.volume = currentVolume === 0 ? 0.7 : 0;
  }
}
}