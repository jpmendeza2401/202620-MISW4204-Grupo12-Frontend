import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { ESTADOS_TAREA, EstadoTarea, Tarea } from '../../../core/models/tarea.models';
import { VinculacionPropia } from '../../../core/models/reporte.models';
import { ReporteService } from '../../../core/services/reporte.service';
import { TareaService } from '../../../core/services/tarea.service';
import { aISO, etiquetaSemana, lunesDe, sumarDias } from '../semana';

/**
 * Registro semanal de tareas del monitor o asistente graduado (RF-06).
 * Muestra las tareas propias de una vinculación en una semana lunes–domingo.
 */
@Component({
  selector: 'app-mis-tareas',
  templateUrl: './mis-tareas.html',
})
export class MisTareas implements OnInit {
  private readonly tareasApi = inject(TareaService);
  private readonly reportesApi = inject(ReporteService);

  /** Lunes de la semana en curso (YYYY-MM-DD). */
  protected readonly semanaActual = aISO(lunesDe(new Date()));

  protected readonly vinculaciones = signal<VinculacionPropia[]>([]);
  protected readonly vinculacionId = signal<string>('');
  protected readonly semana = signal<string>(this.semanaActual);
  protected readonly tareas = signal<Tarea[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

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

  protected elegirVinculacion(id: string): void {
    this.vinculacionId.set(id);
    this.cargar();
  }

  protected moverSemana(semanas: number): void {
    const nueva = sumarDias(this.semana(), semanas * 7);
    if (nueva > this.semanaActual) return; // no se reportan semanas futuras
    this.semana.set(nueva);
    this.cargar();
  }

  protected irASemanaActual(): void {
    this.semana.set(this.semanaActual);
    this.cargar();
  }

  protected cargar(): void {
    if (!this.vinculacionId()) return;
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
    return err.error?.error ?? 'Ocurrió un error al consultar las tareas';
  }
}
