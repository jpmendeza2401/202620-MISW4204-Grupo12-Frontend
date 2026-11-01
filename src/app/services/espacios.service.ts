
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  EspacioAcademico,
  CrearEspacioRequest
} from '../models/espacio.model';

@Injectable({
  providedIn: 'root'
})
export class EspaciosService {

  private http = inject(HttpClient);

  // Ajustar al puerto donde se ejecuta tu backend Go.
  private apiUrl = 'http://localhost:8080/api/v1/espacios';

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
