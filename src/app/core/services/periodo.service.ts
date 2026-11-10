import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { Periodo, PeriodoCreate, PeriodoFiltro } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PeriodoService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/periodos`;

  crear(periodo: PeriodoCreate) {
    return this.http.post<Periodo>(this.apiUrl, periodo);
  }

  listar(filtro: PeriodoFiltro = {}) {
    let params = new HttpParams();
    if (filtro.codigo?.trim()) params = params.set('codigo', filtro.codigo.trim());
    if (filtro.habilitado !== undefined) params = params.set('habilitado', filtro.habilitado);
    if (filtro.vigente !== undefined) params = params.set('vigente', filtro.vigente);
    return this.http.get<{
      total: number;
      periodos: Periodo[];
    }>(this.apiUrl, { params });
  }
}
