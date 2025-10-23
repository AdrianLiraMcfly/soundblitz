import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearArtistasComponent } from './crear-artistas-component';

describe('CrearArtistasComponent', () => {
  let component: CrearArtistasComponent;
  let fixture: ComponentFixture<CrearArtistasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearArtistasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearArtistasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
