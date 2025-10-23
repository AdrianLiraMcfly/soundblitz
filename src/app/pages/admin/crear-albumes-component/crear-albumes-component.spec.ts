import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearAlbumesComponent } from './crear-albumes-component';

describe('CrearAlbumesComponent', () => {
  let component: CrearAlbumesComponent;
  let fixture: ComponentFixture<CrearAlbumesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearAlbumesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearAlbumesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
