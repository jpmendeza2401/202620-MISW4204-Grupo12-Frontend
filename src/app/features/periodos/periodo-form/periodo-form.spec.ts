import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { PeriodoForm } from './periodo-form';

describe('PeriodoForm', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodoForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  it('no envía si el formulario es inválido', () => {
    const fixture = TestBed.createComponent(PeriodoForm);
    (fixture.componentInstance as any).guardar();
    http.expectNone(`${environment.apiUrl}/periodos`);
  });

  it('rechaza fecha fin anterior a inicio', () => {
    const fixture = TestBed.createComponent(PeriodoForm);
    const form = (fixture.componentInstance as any).form;
    form.patchValue({ codigo: '2025-1', fecha_inicio: '2025-05-01', fecha_fin: '2025-04-01' });
    expect(form.hasError('fechaFinAnterior')).toBe(true);
  });

  it('envía POST /periodos con datos válidos', () => {
    const fixture = TestBed.createComponent(PeriodoForm);
    const cmp = fixture.componentInstance as any;
    cmp.form.patchValue({ codigo: ' 2025-1 ', fecha_inicio: '2025-03-03', fecha_fin: '2025-07-18' });
    cmp.guardar();
    const req = http.expectOne(`${environment.apiUrl}/periodos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.codigo).toBe('2025-1');
    req.flush({ id: '1', codigo: '2025-1', fecha_inicio: '2025-03-03', fecha_fin: '2025-07-18', habilitado: true }, { status: 201, statusText: 'Created' });
    expect(cmp.exito()).toContain('2025-1');
  });
});
