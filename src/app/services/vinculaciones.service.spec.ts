import { TestBed } from '@angular/core/testing';

import { VinculacionesService } from './vinculaciones.service';

describe('VinculacionesService', () => {
  let service: VinculacionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VinculacionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
