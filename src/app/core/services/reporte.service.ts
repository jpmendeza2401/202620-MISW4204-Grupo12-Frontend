
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
  FiltrosReporte,
  HistorialSemana,
  MisVinculaciones,
  PersonaVinculada,
  TareaPropia,
  TareaReportada,
  TareasEspacio,
  TrabajoPersona,
  VinculacionesPersona,
  CrearReporteRequest,
  CrearReporteResponse,
  AnalizarReporteResponse,
  GenerarPdfResponse,
  ListarReportesResponse,
} from '../models/reporte.models';

function params(filtros: Record<string, string | undefined>): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(filtros)) {
    if (v) p = p.set(k, v);
  }
  return p;
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  personasVinculadas() {
    return this.http.get<PersonaVinculada[] | null>(
      `${this.base}/reportes/personas-vinculadas`
    );
  }

  vinculacionesPersona(f: FiltrosReporte) {
    return this.http.get<VinculacionesPersona>(
      `${this.base}/reportes/vinculaciones-persona`,
      {
        params: params({ usuario_id: f.usuario_id }),
      }
    );
  }

  tareasEspacio(f: FiltrosReporte) {
    return this.http.get<TareasEspacio>(
      `${this.base}/reportes/tareas-espacio`,
      {
        params: params({ espacio_id: f.espacio_id }),
      }
    );
  }

  trabajoConsolidado(f: FiltrosReporte) {
    return this.http.get<TrabajoPersona[] | null>(
      `${this.base}/reportes/trabajo-consolidado`,
      {
        params: params({
          usuario_id: f.usuario_id,
          periodo_id: f.periodo_id,
        }),
      }
    );
  }

  tareasReportadas(f: FiltrosReporte) {
    return this.http.get<TareaReportada[] | null>(
      `${this.base}/reportes/tareas-reportadas`,
      {
        params: params({
          espacio_id: f.espacio_id,
          usuario_id: f.usuario_id,
          periodo_id: f.periodo_id,
        }),
      }
    );
  }

  misVinculaciones() {
    return this.http.get<MisVinculaciones>(
      `${this.base}/vinculaciones/propias`
    );
  }

  tareasPropias() {
    return this.http.get<TareaPropia[] | null>(
      `${this.base}/tareas/propias`
    );
  }

  historialSemanal() {
    return this.http.get<HistorialSemana[] | null>(
      `${this.base}/tareas/historial`
    );
  }

  // =====================================
  // REPORTES SEMANALES
  // =====================================

  listarReportesSemanales() {
    return this.http.get<ListarReportesResponse>(
      `${this.base}/reportes/semanales`
    );
  }

  solicitarReporteSemanal(datos: CrearReporteRequest) {
    return this.http.post<CrearReporteResponse>(
      `${this.base}/reportes/semanales`,
      datos
    );
  }

  analizarReporteSemanal(id: string) {
    return this.http.post<AnalizarReporteResponse>(
      `${this.base}/reportes/semanales/${id}/analizar`,
      {}
    );
  }

  generarPdfReporteSemanal(id: string) {
    return this.http.post<GenerarPdfResponse>(
      `${this.base}/reportes/semanales/${id}/pdf`,
      {}
    );
  }

  descargarPdfReporteSemanal(id: string) {
    return this.http.get(
      `${this.base}/reportes/semanales/${id}/pdf/descargar`,
      {
        responseType: 'blob'
      }
    );
  }
}
