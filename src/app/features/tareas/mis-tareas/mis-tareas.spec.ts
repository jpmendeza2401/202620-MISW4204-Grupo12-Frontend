import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { Tarea } from '../../../core/models/tarea.models';
import { aISO, lunesDe } from '../semana';
import { MisTareas } from './mis-tareas';

const API = environment.apiUrl;
const LUNES_ACTUAL = aISO(lunesDe(new Date()));

const tarea: Tarea = {
  id: 't1',
  vinculacion_id: 'v1',
  estado: 'abierto',
  titulo: 'Calificar taller 3',
  descripcion: 'Revisión de entregas',
  horas_invertidas: 4,
  observaciones: null,
  semana_inicio: LUNES_ACTUAL,
  semana_fin: LUNES_ACTUAL,
  es_tardia: false,
};

describe('MisTareas', () => {
  let fixture: ComponentFixture<MisTareas>;
  // Acceso a miembros protegidos solo para las pruebas.
  let c: any;
  let http: HttpTestingController;

  /** Responde la carga inicial: una vinculación y sus tareas de la semana. */
  function cargaInicial(tareas: Tarea[] = [tarea]) {
    http.expectOne(`${API}/vinculaciones/propias`).flush({
      usuario_id: 'u1',
      nombre: 'Monitor',
      vinculaciones: [
        {
          vinculacion_id: 'v1',
          espacio_academico_id: 'e1',
          espacio_nombre: 'Cloud',
          espacio_tipo: 'curso',
          rol_operativo: 'monitor',
          horas_contratadas: 10,
          fecha_creacion: '2026-08-01',
        },
      ],
    });
    const req = http.expectOne((r) => r.url === `${API}/tareas`);
    expect(req.request.params.get('vinculacion_id')).toBe('v1');
    expect(req.request.params.get('semana')).toBe(LUNES_ACTUAL);
    req.flush(tareas);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisTareas],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MisTareas);
    c = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges(); // ngOnInit
  });

  afterEach(() => http.verify());

  it('carga la primera vinculación y sus tareas de la semana actual', () => {
    cargaInicial();
    expect(c.tareas().length).toBe(1);
    expect(c.totalHoras()).toBe(4);
  });

  it('el selector de estado de cada tarea muestra su estado real', () => {
    cargaInicial([{ ...tarea, estado: 'en_desarrollo' }]);
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector(
      'select[aria-label^="Estado de"]',
    );
    expect(select.value).toBe('en_desarrollo');
  });

  it('registra una tarea nueva y recarga la lista', () => {
    cargaInicial([]);
    c.abrirNueva();
    c.form.setValue({
      titulo: '  Preparar monitoría ',
      descripcion: 'Ejercicios',
      estado: 'en_desarrollo',
      horas_invertidas: 2,
      observaciones: '',
    });
    c.guardar();

    const post = http.expectOne(`${API}/tareas`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      vinculacion_id: 'v1',
      titulo: 'Preparar monitoría',
      descripcion: 'Ejercicios',
      estado: 'en_desarrollo',
      horas_invertidas: 2,
      observaciones: null,
    });
    post.flush({ ...tarea, id: 't2', titulo: 'Preparar monitoría' });

    http.expectOne((r) => r.url === `${API}/tareas` && r.method === 'GET').flush([]);
    expect(c.editando()).toBeNull();
    expect(c.exito()).toContain('registrada');
  });

  it('no envía nada si el formulario es inválido', () => {
    cargaInicial([]);
    c.abrirNueva();
    c.form.patchValue({ titulo: '', descripcion: '', horas_invertidas: -1 });
    c.guardar();
    http.expectNone(`${API}/tareas`);
    expect(c.editando()).toBe('nueva');
  });

  it('muestra el mensaje del backend cuando rechaza la tarea', () => {
    cargaInicial([]);
    c.abrirNueva();
    c.form.patchValue({ titulo: 'X', descripcion: 'Y', horas_invertidas: 1 });
    c.guardar();
    http
      .expectOne(`${API}/tareas`)
      .flush(
        { error: 'el espacio académico está cerrado' },
        { status: 409, statusText: 'Conflict' },
      );
    expect(c.errorFormulario()).toBe('el espacio académico está cerrado');
  });

  it('las semanas anteriores son de solo lectura', () => {
    cargaInicial();
    c.moverSemana(-1);
    http.expectOne((r) => r.url === `${API}/tareas`).flush([tarea]);
    expect(c.puedeModificar(tarea)).toBe(false);
  });

  // ---------- Evidencias ----------

  const adjunto = {
    id: 'a1',
    tarea_id: 't1',
    nombre_archivo: 'acta.pdf',
    tipo_mime: 'application/pdf',
  };

  it('abre las evidencias de una tarea y las lista', () => {
    cargaInicial();
    c.alternarAdjuntos(tarea);
    http.expectOne(`${API}/tareas/t1/adjuntos`).flush([adjunto]);
    fixture.detectChanges();
    expect(c.adjuntosDe('t1').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('acta.pdf');
    expect(fixture.nativeElement.querySelector('input[type="file"]')).not.toBeNull();
  });

  it('en semanas anteriores muestra evidencias sin permitir adjuntar', () => {
    cargaInicial();
    c.moverSemana(-1);
    http
      .expectOne((r) => r.url === `${API}/tareas`)
      .flush([{ ...tarea, semana_inicio: '2000-01-03' }]);
    c.alternarAdjuntos(tarea);
    http.expectOne(`${API}/tareas/t1/adjuntos`).flush(null);
    fixture.detectChanges();
    expect(c.adjuntosDe('t1')).toEqual([]);
    expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeNull();
  });

  it('rechaza en el navegador archivos grandes o de tipo no permitido', () => {
    cargaInicial();
    const grande = new File(['x'], 'a.pdf');
    Object.defineProperty(grande, 'size', { value: 11 * 1024 * 1024 });
    expect(c.validarArchivo(grande)).toContain('10 MB');
    expect(c.validarArchivo(new File(['x'], 'virus.exe'))).toContain('no permitido');
    expect(c.validarArchivo(new File(['x'], 'Acta.PDF'))).toBeNull();
  });

  it('sube una evidencia y la agrega a la lista', () => {
    cargaInicial();
    c.alternarAdjuntos(tarea);
    http.expectOne(`${API}/tareas/t1/adjuntos`).flush([]);
    const archivo = new File(['%PDF'], 'acta.pdf');
    const input = { files: [archivo], value: 'C:/acta.pdf' };
    c.subirAdjunto(tarea, { target: input } as unknown as Event);
    const req = http.expectOne(`${API}/tareas/t1/adjuntos`);
    expect(req.request.method).toBe('POST');
    req.flush(adjunto);
    expect(c.adjuntosDe('t1')).toEqual([adjunto]);
    expect(input.value).toBe('');
  });

  it('muestra el mensaje del backend si la subida falla', () => {
    cargaInicial();
    c.alternarAdjuntos(tarea);
    http.expectOne(`${API}/tareas/t1/adjuntos`).flush([]);
    c.subirAdjunto(tarea, {
      target: { files: [new File(['x'], 'a.txt')], value: '' },
    } as unknown as Event);
    http
      .expectOne(`${API}/tareas/t1/adjuntos`)
      .flush({ error: 'tipo de archivo no permitido' }, { status: 415, statusText: 'Unsupported' });
    expect(c.errorAdjuntos()).toBe('tipo de archivo no permitido');
  });

  it('informa si la descarga falla', () => {
    cargaInicial();
    c.descargarAdjunto(tarea, adjunto);
    http
      .expectOne(`${API}/tareas/t1/adjuntos/a1/descargar`)
      .flush(new Blob(['{}']), { status: 404, statusText: 'Not Found' });
    expect(c.errorAdjuntos()).toBe('La evidencia ya no existe');
  });
});
