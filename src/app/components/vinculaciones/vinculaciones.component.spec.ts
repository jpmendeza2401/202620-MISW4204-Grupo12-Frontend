import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VinculacionesComponent } from './vinculaciones.component';

describe('VinculacionesComponent', () => {
  let component: VinculacionesComponent;
  let fixture: ComponentFixture<VinculacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VinculacionesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VinculacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
