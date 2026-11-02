import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Tarea } from '../models/tarea.models';
import { TareaService } from './tarea.service';

const BASE = `${environment.apiUrl}/tareas`;

const tareaEjemplo: Tarea = {
  id: 't1',
  vinculacion_id: 'v1',
  estado: 'abierto',
  titulo: 'Calificar taller 3',
  descripcion: 'Revisión de entregas',
  horas_invertidas: 4,
  observaciones: null,
  semana_inicio: '2026-10-26',
  semana_fin: '2026-11-01',
  es_tardia: false,
};

describe('TareaService', () => {
  let service: TareaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TareaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista las tareas de la vinculación sin enviar semana', () => {
    service.listar('v1').subscribe((tareas) => expect(tareas).toEqual([tareaEjemplo]));

    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('vinculacion_id')).toBe('v1');
    expect(req.request.params.has('semana')).toBe(false);
    req.flush([tareaEjemplo]);
  });

  it('lista las tareas de una semana específica', () => {
    service.listar('v1', '2026-10-26').subscribe();

    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('semana')).toBe('2026-10-26');
    req.flush([]);
  });

  it('crea una tarea con POST', () => {
    const nueva = {
      vinculacion_id: 'v1',
      titulo: 'Calificar taller 3',
      descripcion: 'Revisión de entregas',
      estado: 'abierto' as const,
      horas_invertidas: 4,
      observaciones: null,
    };
    service.crear(nueva).subscribe((t) => expect(t.id).toBe('t1'));

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nueva);
    req.flush(tareaEjemplo);
  });

  it('actualiza una tarea con PUT', () => {
    const cambios = {
      titulo: 'Nuevo título',
      descripcion: 'Desc',
      estado: 'finalizado' as const,
      horas_invertidas: 6,
      observaciones: 'Listo',
    };
    service.actualizar('t1', cambios).subscribe();

    const req = http.expectOne(`${BASE}/t1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(cambios);
    req.flush({ ...tareaEjemplo, ...cambios });
  });

  it('cambia solo el estado con PATCH', () => {
    service.cambiarEstado('t1', 'en_desarrollo').subscribe();

    const req = http.expectOne(`${BASE}/t1/estado`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ estado: 'en_desarrollo' });
    req.flush({ ...tareaEjemplo, estado: 'en_desarrollo' });
  });

  it('elimina una tarea con DELETE', () => {
    service.eliminar('t1').subscribe();

    const req = http.expectOne(`${BASE}/t1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
