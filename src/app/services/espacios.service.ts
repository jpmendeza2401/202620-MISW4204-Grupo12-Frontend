
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  EspacioAcademico,
  CrearEspacioRequest
} from '../models/espacio.model';

@Injectable({
  providedIn: 'root'
})
export class EspaciosService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/espacios`;

  /**
   * Consultar espacios activos del profesor autenticado.
   */
  listar(): Observable<EspacioAcademico[]> {
    return this.http.get<EspacioAcademico[]>(this.apiUrl);
  }

  /**
   * Crear un espacio académico.
   */
  crear(request: CrearEspacioRequest): Observable<EspacioAcademico> {
    return this.http.post<EspacioAcademico>(
      this.apiUrl,
      request
    );
  }

  /**
   * Cerrar un espacio académico.
   */
  cerrar(id: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/${id}/cerrar`,
      {}
    );
  }

  /**
   * Consultar espacios cerrados del profesor.
   */
  listarCerrados(): Observable<EspacioAcademico[]> {
    return this.http.get<EspacioAcademico[]>(
      `${this.apiUrl}/cerrados`
    );
  }
}
