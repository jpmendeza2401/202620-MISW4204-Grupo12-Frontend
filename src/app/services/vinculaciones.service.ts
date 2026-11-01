
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Vinculacion {
  id: number;
  usuario_id: number;
  espacio_academico_id: number;
  rol_operativo: 'monitor' | 'asistente_graduado';
  horas_contratadas: number;
  fecha_creacion: string;
}

export interface CrearVinculacionRequest {
  usuario_id: number;
  espacio_academico_id: number;
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

  private readonly apiUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * Crear una vinculación.
   */
  crearVinculacion(
    request: CrearVinculacionRequest
  ): Observable<Vinculacion> {
    return this.http.post<Vinculacion>(
      `${this.apiUrl}/vinculaciones`,
      request
    );
  }

  /**
   * Consultar las vinculaciones de un espacio académico.
   */
  obtenerVinculaciones(
    espacioId: number
  ): Observable<Vinculacion[]> {
    return this.http.get<Vinculacion[]>(
      `${this.apiUrl}/espacios/${espacioId}/vinculaciones`
    );
  }

  /**
   * Actualizar las horas contratadas de una vinculación.
   */
  actualizarHoras(
    vinculacionId: number,
    request: ActualizarHorasRequest
  ): Observable<Vinculacion> {
    return this.http.put<Vinculacion>(
      `${this.apiUrl}/vinculaciones/${vinculacionId}/horas`,
      request
    );
  }
}
