import { HttpErrorResponse } from '@angular/common/http';
import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import {
  FiltrosReporte,
  HistorialSemana,
  MisVinculaciones,
  PersonaVinculada,
  TareaBase,
  TareaPropia,
  TareaReportada,
  TareasEspacio,
  TrabajoPersona,
  VinculacionesPersona,
} from '../../../core/models/reporte.models';
import { ReporteService } from '../../../core/services/reporte.service';

type ReporteId =
  | 'personas-vinculadas'
  | 'vinculaciones-persona'
  | 'tareas-espacio'
  | 'trabajo-consolidado'
  | 'tareas-reportadas'
  | 'vinculaciones-propias'
  | 'tareas-propias'
  | 'historial';

type Filtro = 'usuario' | 'espacio' | 'periodo';

interface ReporteDef {
  id: ReporteId;
  nombre: string;
  descripcion: string;
  requeridos: Filtro[];
  opcionales: Filtro[];
}

const REPORTES: ReporteDef[] = [
  {
    id: 'personas-vinculadas',
    nombre: 'Personas vinculadas',
    descripcion: 'Monitores y asistentes vinculados a tus espacios académicos.',
    requeridos: [],
    opcionales: [],
  },
  {
    id: 'vinculaciones-persona',
    nombre: 'Vinculaciones por persona',
    descripcion: 'Vinculaciones de una persona con tus espacios académicos.',
    requeridos: ['usuario'],
    opcionales: [],
  },
  {
    id: 'tareas-espacio',
    nombre: 'Tareas por espacio académico',
    descripcion: 'Tareas reportadas dentro de un espacio académico.',
    requeridos: ['espacio'],
    opcionales: [],
  },
  {
    id: 'trabajo-consolidado',
    nombre: 'Trabajo consolidado',
    descripcion: 'Total de tareas y horas por persona. Admite filtros.',
    requeridos: [],
    opcionales: ['usuario', 'periodo'],
  },
  {
    id: 'tareas-reportadas',
    nombre: 'Tareas reportadas',
    descripcion: 'Todas las tareas reportadas. Admite filtros.',
    requeridos: [],
    opcionales: ['espacio', 'usuario', 'periodo'],
  },
  {
    id: 'vinculaciones-propias',
    nombre: 'Mis vinculaciones',
    descripcion: 'Tus propias vinculaciones.',
    requeridos: [],
    opcionales: [],
  },
  {
    id: 'tareas-propias',
    nombre: 'Mis tareas',
    descripcion: 'Tareas que has reportado.',
    requeridos: [],
    opcionales: [],
  },
  {
    id: 'historial',
    nombre: 'Historial semanal',
    descripcion: 'Tus tareas y horas agrupadas por semana.',
    requeridos: [],
    opcionales: [],
  },
];

type Resultado =
  | { id: 'personas-vinculadas'; data: PersonaVinculada[] }
  | { id: 'vinculaciones-persona'; data: VinculacionesPersona }
  | { id: 'tareas-espacio'; data: TareasEspacio }
  | { id: 'trabajo-consolidado'; data: TrabajoPersona[] }
  | { id: 'tareas-reportadas'; data: TareaReportada[] }
  | { id: 'vinculaciones-propias'; data: MisVinculaciones }
  | { id: 'tareas-propias'; data: TareaPropia[] }
  | { id: 'historial'; data: HistorialSemana[] };

interface Opcion {
  valor: string;
  texto: string;
}

@Component({
  selector: 'app-reportes',
  imports: [NgTemplateOutlet],
  templateUrl: './reportes.html',
})
export class Reportes {
  private readonly api = inject(ReporteService);

  protected readonly reportes = REPORTES;
  protected readonly seleccionado = signal<ReporteId | ''>('');
  protected readonly filtros = signal<Record<Filtro, string>>({
    usuario: '',
    espacio: '',
    periodo: '',
  });
  protected readonly personas = signal<PersonaVinculada[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resultado = signal<Resultado | null>(null);

  protected readonly definicion = computed(
    () => REPORTES.find((r) => r.id === this.seleccionado()) ?? null,
  );

  protected readonly filtrosVisibles = computed(() => {
    const d = this.definicion();
    if (!d) return [];
    return [
      ...d.requeridos.map((f) => ({ filtro: f, requerido: true })),
      ...d.opcionales.map((f) => ({ filtro: f, requerido: false })),
    ];
  });

  protected readonly puedeConsultar = computed(() => {
    const d = this.definicion();
    if (!d || this.cargando()) return false;
    return d.requeridos.every((f) => !!this.filtros()[f]);
  });

  protected readonly opciones = computed<Record<Filtro, Opcion[]>>(() => {
    const usuarios = new Map<string, string>();
    const espacios = new Map<string, string>();
    const periodos = new Map<string, string>();
    for (const p of this.personas()) {
      usuarios.set(p.usuario_id, p.nombre);
      espacios.set(p.espacio_academico_id, p.espacio_nombre);
      periodos.set(p.periodo_academico_id, p.periodo_codigo);
    }
    const lista = (m: Map<string, string>) =>
      [...m]
        .map(([valor, texto]) => ({ valor, texto }))
        .sort((a, b) => a.texto.localeCompare(b.texto));
    return { usuario: lista(usuarios), espacio: lista(espacios), periodo: lista(periodos) };
  });

  protected seleccionar(id: string): void {
    this.seleccionado.set(id as ReporteId | '');
    this.resultado.set(null);
    this.error.set(null);
    this.filtros.set({ usuario: '', espacio: '', periodo: '' });
    const d = this.definicion();
    if (d && d.requeridos.length + d.opcionales.length > 0 && !this.personas().length) {
      this.api.personasVinculadas().subscribe({
        next: (p) => this.personas.set(p ?? []),
        error: () => this.personas.set([]),
      });
    }
  }

  protected cambiarFiltro(filtro: Filtro, valor: string): void {
    this.filtros.update((f) => ({ ...f, [filtro]: valor }));
  }

  protected nombreFiltro(f: Filtro): string {
    return { usuario: 'Persona', espacio: 'Espacio académico', periodo: 'Periodo' }[f];
  }

  protected consultar(): void {
    const d = this.definicion();
    if (!d || !this.puedeConsultar()) return;
    const f = this.filtros();
    const q: FiltrosReporte = {
      usuario_id: f.usuario,
      espacio_id: f.espacio,
      periodo_id: f.periodo,
    };
    this.error.set(null);
    this.resultado.set(null);
    this.cargando.set(true);

    const wrap = <T>(obs: Observable<T>, map: (data: T) => Resultado) =>
      obs.subscribe({
        next: (data) => {
          this.cargando.set(false);
          this.resultado.set(map(data));
        },
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          this.error.set(this.mensaje(err));
        },
      });

    switch (d.id) {
      case 'personas-vinculadas':
        wrap(this.api.personasVinculadas(), (data) => {
          this.personas.set(data ?? []);
          return { id: 'personas-vinculadas', data: data ?? [] };
        });
        break;
      case 'vinculaciones-persona':
        wrap(this.api.vinculacionesPersona(q), (data) => ({ id: 'vinculaciones-persona', data }));
        break;
      case 'tareas-espacio':
        wrap(this.api.tareasEspacio(q), (data) => ({ id: 'tareas-espacio', data }));
        break;
      case 'trabajo-consolidado':
        wrap(this.api.trabajoConsolidado(q), (data) => ({
          id: 'trabajo-consolidado',
          data: data ?? [],
        }));
        break;
      case 'tareas-reportadas':
        wrap(this.api.tareasReportadas(q), (data) => ({
          id: 'tareas-reportadas',
          data: data ?? [],
        }));
        break;
      case 'vinculaciones-propias':
        wrap(this.api.misVinculaciones(), (data) => ({ id: 'vinculaciones-propias', data }));
        break;
      case 'tareas-propias':
        wrap(this.api.tareasPropias(), (data) => ({ id: 'tareas-propias', data: data ?? [] }));
        break;
      case 'historial':
        wrap(this.api.historialSemanal(), (data) => ({ id: 'historial', data: data ?? [] }));
        break;
    }
  }

  protected tareas<T extends TareaBase>(lista: T[] | null | undefined): T[] {
    return lista ?? [];
  }

  protected claseEstado(estado: string): string {
    const e = estado?.toLowerCase();
    if (e === 'finalizado')
      return 'bg-operational-teal-tint text-operational-teal-deep';
    if (e === 'en_desarrollo') return 'bg-blue-50 text-academic-blue';
    return 'bg-slate-100 text-slate-var';
  }

  private mensaje(err: HttpErrorResponse): string {
    if (err.status === 0) return 'No se pudo conectar con el servidor';
    if (err.status === 403) return 'No tienes permisos para consultar este reporte';
    if (err.status === 404) return err.error?.error ?? 'No se encontró la información solicitada';
    return err.error?.error ?? 'Error al consultar el reporte';
  }
}
