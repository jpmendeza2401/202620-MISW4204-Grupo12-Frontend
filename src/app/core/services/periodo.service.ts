import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { Periodo, PeriodoCreate } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PeriodoService {
  private readonly http = inject(HttpClient);

  crear(periodo: PeriodoCreate) {
    return this.http.post<Periodo>(`${environment.apiUrl}/periodos`, periodo);
  }
}
