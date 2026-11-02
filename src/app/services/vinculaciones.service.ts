
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Vinculacion {
  id: string;
  usuario_id: string;
  espacio_academico_id: string;
  rol_operativo: 'monitor' | 'asistente_graduado';
  horas_contratadas: number;
  fecha_creacion: string;
}

export interface CrearVinculacionRequest {
  usuario_id: string;
  espacio_academico_id: string;
  rol_operativo: 'monitor' | 'asistente_graduado';
  horas_contratadas: number;
}

export interface ActualizarHorasRequest {
  horas_contratadas: number;
}

@Injectable({
  providedIn: 'root'
})
export class VinculacionesService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vinculaciones`;

  crear(request: CrearVinculacionRequest): Observable<Vinculacion> {
    return this.http.post<Vinculacion>(this.apiUrl, request);
  }

  listarPorEspacio(espacioId: string): Observable<Vinculacion[]> {
    return this.http.get<Vinculacion[]>(
      `${environment.apiUrl}/espacios/${espacioId}/vinculaciones`
    );
  }

  actualizarHoras(
    vinculacionId: string,
    request: ActualizarHorasRequest
  ): Observable<Vinculacion> {
    return this.http.put<Vinculacion>(
      `${this.apiUrl}/${vinculacionId}/horas`,
      request
    );
  }
}
