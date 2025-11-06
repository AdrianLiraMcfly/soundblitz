import { TestBed } from '@angular/core/testing';

import { PlayingService } from './playing-service';

describe('PlayingService', () => {
  let service: PlayingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlayingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
