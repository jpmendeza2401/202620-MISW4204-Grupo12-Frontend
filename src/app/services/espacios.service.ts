import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';

import {
  EspacioAcademico,
  CrearEspacioRequest
} from '../models/espacio.model';

@Injectable({
  providedIn: 'root'
})
export class EspaciosService {

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly apiUrl = `${environment.apiUrl}/espacios`;

  /**
   * Consultar espacios activos según el perfil autenticado.
   */
  listar(): Observable<EspacioAcademico[]> {

    if (this.auth.esMonitor()) {
      return this.http.get<EspacioAcademico[]>(
        `${this.apiUrl}/vinculados`
      );
    }

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
   * Consultar espacios cerrados según el perfil autenticado.
   */
  listarCerrados(): Observable<EspacioAcademico[]> {

    if (this.auth.esMonitor()) {
      return this.http.get<EspacioAcademico[]>(
        `${this.apiUrl}/vinculados/cerrados`
      );
    }

    return this.http.get<EspacioAcademico[]>(
      `${this.apiUrl}/cerrados`
    );
  }
}