import { Component } from '@angular/core';
import { ApiServices } from '../../shared/services/api-services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-crear-canciones-component',
  templateUrl: './crear-canciones-component.html',
  styleUrl: './crear-canciones-component.css'
})
export class CrearCancionesComponent {
  busqueda: string = '';
  resultados: any[] = [];

  constructor(private api: ApiServices) {}

  buscarCancion() {
    if (!this.busqueda) return;
    this.api.buscarCancionDeezer(this.busqueda).subscribe({
      next: (res: any) => {
        this.resultados = res.data || [];
      },
      error: (error) => {
        console.error('Error al buscar en Deezer:', error);
        alert('Error al buscar en Deezer');
      }
    });
  }

  crearCancion(track: any) {
    // Mapear datos de Deezer a tu BD
    const nuevaCancion = {
      nombre: track.title,
      artista_id: track.artist.id, // O guardar nombre si no tienes el artista en tu BD
      album_id: track.album.id,    // Igual, depende de tu modelo
      url_cancion: track.link,
      url_portada: track.album.cover_medium
    };
    this.api.crearCancion(nuevaCancion).subscribe({
      next: () => {
        alert('Canción creada correctamente');
      },
      error: (error) => {
        alert('Error al crear la canción');
      }
    });
  }
}