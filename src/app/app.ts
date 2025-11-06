import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MusicPlayerComponent } from './pages/shared/components/reproductor-component/reproductor-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MusicPlayerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('soundblitz');
}
