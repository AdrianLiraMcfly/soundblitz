import { Injectable } from '@angular/core';
import QRCode from 'qrcode';

export interface SongQRData {
  type: 'soundblitz_song';
  songId: number;
  songName: string;
  artistName: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class QrService {
  
  // Generar código QR para una canción
  async generateSongQR(cancion: any): Promise<string> {
    try {
      const qrData: SongQRData = {
        type: 'soundblitz_song',
        songId: cancion.id,
        songName: cancion.nombre,
        artistName: cancion.artistaNombre || 'Desconocido',
        timestamp: Date.now()
      };

      // Convertir a JSON y luego generar QR
      const dataString = JSON.stringify(qrData);
      
      // Generar QR como Data URL
      const qrCodeDataUrl = await QRCode.toDataURL(dataString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        width: 400,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      console.log('✅ QR generado para canción:', cancion.nombre);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('❌ Error al generar QR:', error);
      throw error;
    }
  }

  // Parsear datos del QR
  parseSongQR(qrText: string): SongQRData | null {
    try {
      const data = JSON.parse(qrText);
      
      if (data.type === 'soundblitz_song' && data.songId) {
        console.log('✅ QR válido de SoundBlitz:', data);
        return data;
      }
      
      console.warn('⚠️ QR no es de SoundBlitz');
      return null;
    } catch (error) {
      console.error('❌ Error al parsear QR:', error);
      return null;
    }
  }

  // Descargar QR como imagen
  downloadQR(qrDataUrl: string, songName: string): void {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `SoundBlitz_${songName.replace(/[^a-z0-9]/gi, '_')}_QR.png`;
    link.click();
    console.log('💾 QR descargado:', songName);
  }

  // Compartir QR (Web Share API)
  async shareQR(qrDataUrl: string, songName: string, artistName: string): Promise<void> {
    if (!navigator.share) {
      console.warn('⚠️ Web Share API no disponible');
      this.downloadQR(qrDataUrl, songName);
      return;
    }

    try {
      // Convertir Data URL a Blob
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${songName}_QR.png`, { type: 'image/png' });

      await navigator.share({
        title: `${songName} - SoundBlitz`,
        text: `Escanea este QR para reproducir "${songName}" de ${artistName} en SoundBlitz`,
        files: [file]
      });

      console.log('✅ QR compartido exitosamente');
    } catch (error) {
      console.error('❌ Error al compartir:', error);
      this.downloadQR(qrDataUrl, songName);
    }
  }
}