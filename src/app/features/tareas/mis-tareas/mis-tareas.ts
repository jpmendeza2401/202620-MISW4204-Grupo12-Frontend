import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  Adjunto,
  ESTADOS_TAREA,
  EXTENSIONES_ADJUNTO,
  EstadoTarea,
  MAX_BYTES_ADJUNTO,
  Tarea,
} from '../../../core/models/tarea.models';
import { VinculacionPropia } from '../../../core/models/reporte.models';
import { ReporteService } from '../../../core/services/reporte.service';
import { TareaService } from '../../../core/services/tarea.service';
import { aISO, etiquetaSemana, lunesDe, sumarDias } from '../semana';

/**
 * Registro semanal de tareas del monitor o asistente graduado (RF-06).
 * Lista las tareas propias de una vinculación en una semana lunes–domingo y,
 * en la semana en curso, permite crearlas, editarlas, cambiar su estado y eliminarlas.
 */
@Component({
  selector: 'app-mis-tareas',
  imports: [ReactiveFormsModule],
  templateUrl: './mis-tareas.html',
})
export class MisTareas implements OnInit {
  private readonly tareasApi = inject(TareaService);
  private readonly reportesApi = inject(ReporteService);
  private readonly fb = inject(FormBuilder);

  protected readonly estados = ESTADOS_TAREA;
  protected readonly extensionesAdjunto = EXTENSIONES_ADJUNTO.join(',');

  /** Lunes de la semana en curso (YYYY-MM-DD). */
  protected readonly semanaActual = aISO(lunesDe(new Date()));

  protected readonly vinculaciones = signal<VinculacionPropia[]>([]);
  protected readonly vinculacionId = signal<string>('');
  protected readonly semana = signal<string>(this.semanaActual);
  protected readonly tareas = signal<Tarea[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);

  /** Evidencias: id de la tarea con el panel abierto y adjuntos cargados por tarea. */
  protected readonly adjuntosAbiertos = signal<string | null>(null);
  protected readonly adjuntos = signal<Record<string, Adjunto[]>>({});
  protected readonly cargandoAdjuntos = signal(false);
  protected readonly subiendoAdjunto = signal(false);
  protected readonly errorAdjuntos = signal<string | null>(null);

  /** Formulario: null = cerrado, 'nueva' = crear, o el id de la tarea en edición. */
  protected readonly editando = signal<'nueva' | string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorFormulario = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(160)]],
    descripcion: ['', Validators.required],
    estado: ['abierto' as EstadoTarea, Validators.required],
    horas_invertidas: [
      0,
      [Validators.required, Validators.min(0), Validators.max(168), Validators.pattern(/^\d+$/)],
    ],
    observaciones: [''],
  });

  protected readonly etiquetaSemana = computed(() => etiquetaSemana(this.semana()));
  protected readonly esSemanaActual = computed(() => this.semana() === this.semanaActual);
  protected readonly totalHoras = computed(() =>
    this.tareas().reduce((suma, t) => suma + t.horas_invertidas, 0),
  );
  protected readonly vinculacion = computed(() =>
    this.vinculaciones().find((v) => v.vinculacion_id === this.vinculacionId()),
  );

  ngOnInit(): void {
    this.reportesApi.misVinculaciones().subscribe({
      next: (res) => {
        const lista = res.vinculaciones ?? [];
        this.vinculaciones.set(lista);
        if (lista.length > 0) {
          this.vinculacionId.set(lista[0].vinculacion_id);
          this.cargar();
        }
      },
      error: (err: HttpErrorResponse) => this.error.set(this.mensaje(err)),
    });
  }

  // ---------- Navegación ----------

  protected elegirVinculacion(id: string): void {
    this.vinculacionId.set(id);
    this.cerrarFormulario();
    this.cargar();
  }

  protected moverSemana(semanas: number): void {
    const nueva = sumarDias(this.semana(), semanas * 7);
    if (nueva > this.semanaActual) return; // no se reportan semanas futuras
    this.semana.set(nueva);
    this.cerrarFormulario();
    this.cargar();
  }

  protected irASemanaActual(): void {
    this.semana.set(this.semanaActual);
    this.cargar();
  }

  protected cargar(): void {
    if (!this.vinculacionId()) return;
    this.cerrarAdjuntos();
    this.cargando.set(true);
    this.error.set(null);
    this.tareasApi.listar(this.vinculacionId(), this.semana()).subscribe({
      next: (lista) => {
        this.tareas.set(lista ?? []);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.tareas.set([]);
        this.error.set(this.mensaje(err));
        this.cargando.set(false);
      },
    });
  }

  // ---------- Formulario (crear / editar) ----------

  /** Solo se modifican tareas de la semana en curso que no sean tardías (RN-30). */
  protected puedeModificar(t: Tarea): boolean {
    return this.esSemanaActual() && !t.es_tardia;
  }

  protected abrirNueva(): void {
    this.form.reset({
      titulo: '',
      descripcion: '',
      estado: 'abierto',
      horas_invertidas: 0,
      observaciones: '',
    });
    this.errorFormulario.set(null);
    this.exito.set(null);
    this.editando.set('nueva');
  }

  protected abrirEdicion(t: Tarea): void {
    this.form.reset({
      titulo: t.titulo,
      descripcion: t.descripcion,
      estado: t.estado,
      horas_invertidas: t.horas_invertidas,
      observaciones: t.observaciones ?? '',
    });
    this.errorFormulario.set(null);
    this.exito.set(null);
    this.editando.set(t.id);
  }

  protected cerrarFormulario(): void {
    this.editando.set(null);
    this.errorFormulario.set(null);
  }

  protected campoInvalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.dirty || c.touched);
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos = {
      titulo: v.titulo.trim(),
      descripcion: v.descripcion.trim(),
      estado: v.estado,
      horas_invertidas: Number(v.horas_invertidas),
      observaciones: v.observaciones.trim() || null,
    };

    const id = this.editando();
    const peticion =
      id === 'nueva'
        ? this.tareasApi.crear({ ...datos, vinculacion_id: this.vinculacionId() })
        : this.tareasApi.actualizar(id!, datos);

    this.guardando.set(true);
    this.errorFormulario.set(null);
    peticion.subscribe({
      next: (t) => {
        this.guardando.set(false);
        this.exito.set(id === 'nueva' ? `Tarea "${t.titulo}" registrada` : 'Cambios guardados');
        this.cerrarFormulario();
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorFormulario.set(this.mensaje(err));
      },
    });
  }

  // ---------- Acciones rápidas ----------

  protected cambiarEstado(t: Tarea, estado: string): void {
    if (estado === t.estado) return;
    this.error.set(null);
    this.tareasApi.cambiarEstado(t.id, estado as EstadoTarea).subscribe({
      next: (actualizada) =>
        this.tareas.update((lista) => lista.map((x) => (x.id === t.id ? actualizada : x))),
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensaje(err));
        this.cargar(); // vuelve a mostrar el estado real
      },
    });
  }

  protected eliminar(t: Tarea): void {
    if (!confirm(`¿Eliminar la tarea "${t.titulo}"? Esta acción no se puede deshacer.`)) return;
    this.error.set(null);
    this.tareasApi.eliminar(t.id).subscribe({
      next: () => {
        this.exito.set(`Tarea "${t.titulo}" eliminada`);
        if (this.editando() === t.id) this.cerrarFormulario();
        this.cargar();
      },
      error: (err: HttpErrorResponse) => this.error.set(this.mensaje(err)),
    });
  }

  // ---------- Evidencias (RF-06.4) ----------

  protected alternarAdjuntos(t: Tarea): void {
    if (this.adjuntosAbiertos() === t.id) {
      this.cerrarAdjuntos();
      return;
    }
    this.adjuntosAbiertos.set(t.id);
    this.errorAdjuntos.set(null);
    this.cargarAdjuntos(t.id);
  }

  protected cerrarAdjuntos(): void {
    this.adjuntosAbiertos.set(null);
    this.errorAdjuntos.set(null);
  }

  protected adjuntosDe(tareaId: string): Adjunto[] {
    return this.adjuntos()[tareaId] ?? [];
  }

  private cargarAdjuntos(tareaId: string): void {
    this.cargandoAdjuntos.set(true);
    this.tareasApi.listarAdjuntos(tareaId).subscribe({
      next: (lista) => {
        this.adjuntos.update((m) => ({ ...m, [tareaId]: lista ?? [] }));
        this.cargandoAdjuntos.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorAdjuntos.set(this.mensaje(err));
        this.cargandoAdjuntos.set(false);
      },
    });
  }

  /** Valida en el navegador lo mismo que el backend: tamaño (10 MB) y extensión. */
  protected validarArchivo(archivo: File): string | null {
    if (archivo.size === 0) return 'El archivo está vacío';
    if (archivo.size > MAX_BYTES_ADJUNTO) return 'El archivo supera 10 MB';
    const nombre = archivo.name.toLowerCase();
    if (!EXTENSIONES_ADJUNTO.some((ext) => nombre.endsWith(ext))) {
      return 'Tipo de archivo no permitido (pdf, png, jpg, txt, docx, xlsx, pptx, zip)';
    }
    return null;
  }

  protected subirAdjunto(t: Tarea, evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;

    const invalido = this.validarArchivo(archivo);
    if (invalido) {
      this.errorAdjuntos.set(invalido);
      return;
    }
    this.subiendoAdjunto.set(true);
    this.errorAdjuntos.set(null);
    this.tareasApi.subirAdjunto(t.id, archivo).subscribe({
      next: (adjunto) => {
        this.subiendoAdjunto.set(false);
        this.adjuntos.update((m) => ({ ...m, [t.id]: [...(m[t.id] ?? []), adjunto] }));
      },
      error: (err: HttpErrorResponse) => {
        this.subiendoAdjunto.set(false);
        this.errorAdjuntos.set(this.mensaje(err));
      },
    });
  }

  protected descargarAdjunto(t: Tarea, a: Adjunto): void {
    this.errorAdjuntos.set(null);
    this.tareasApi.descargarAdjunto(t.id, a.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = a.nombre_archivo;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      // En descargas el cuerpo del error llega como Blob, no como JSON.
      error: (err: HttpErrorResponse) =>
        this.errorAdjuntos.set(
          err.status === 0
            ? 'No se pudo conectar con el servidor'
            : err.status === 404
              ? 'La evidencia ya no existe'
              : 'No se pudo descargar la evidencia',
        ),
    });
  }

  // ---------- Presentación ----------

  protected etiquetaEstado(estado: EstadoTarea): string {
    return ESTADOS_TAREA.find((e) => e.valor === estado)?.etiqueta ?? estado;
  }

  protected claseEstado(estado: EstadoTarea): string {
    if (estado === 'finalizado') return 'bg-slate-100 text-slate-700';
    if (estado === 'en_desarrollo') return 'bg-teal-100 text-teal-700';
    return 'bg-blue-50 text-academic-blue';
  }

  private mensaje(err: HttpErrorResponse): string {
    if (err.status === 0) return 'No se pudo conectar con el servidor';
    if (typeof err.error?.error === 'string') return err.error.error;
    if (err.status === 403) return 'No tienes permiso para esta acción';
    if (err.status === 413) return 'El archivo supera 10 MB';
    return 'Ocurrió un error al procesar la solicitud';
  }
}
