import { TestBed } from '@angular/core/testing';

import { PwaInstallServices } from './pwa-install.services';

describe('PwaInstallServices', () => {
  let service: PwaInstallServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PwaInstallServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
