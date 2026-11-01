
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CrearUsuarioRequest {
  nombre: string;
  correo: string;
  identificador: string;
  [key: string]: unknown;
}

export interface UsuarioResponse {
  id: string;
  nombre: string;
  correo: string;
  identificador: string;
  creado_en: string;
}

export interface AsignarRolRequest {
  rol_id: number;
}

export interface AsignarRolResponse {
  [key: string]: unknown;
}
export interface RolUsuario {
  id: number;
  nombre: string;
}

export interface UsuarioConRoles extends UsuarioResponse {
  roles: RolUsuario[];
}
export class AsignacionRolError extends Error {
  constructor(
    public readonly usuarioCreado: UsuarioResponse,
    public readonly errorOriginal: unknown
  ) {
    super('El usuario fue creado, pero no se pudo asignar el rol.');
    this.name = 'AsignacionRolError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  private obtenerHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('auth_token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  crearUsuario(datos: CrearUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(
      this.apiUrl,
      datos,
      { headers: this.obtenerHeaders() }
    );
  }

  asignarRol(
    usuarioId: string,
    datos: AsignarRolRequest
  ): Observable<AsignarRolResponse> {
    return this.http.post<AsignarRolResponse>(
      `${this.apiUrl}/${usuarioId}/roles`,
      datos,
      { headers: this.obtenerHeaders() }
    );
  }

  crearUsuarioConRol(
    usuario: CrearUsuarioRequest,
    rol: AsignarRolRequest
  ): Observable<{
    usuario: UsuarioResponse;
    asignacion: AsignarRolResponse;
  }> {
    return this.crearUsuario(usuario).pipe(
      switchMap(usuarioCreado =>
        this.asignarRol(usuarioCreado.id, rol).pipe(
          catchError(error =>
            throwError(() =>
              new AsignacionRolError(usuarioCreado, error)
            )
          ),
          switchMap(asignacion => [
            {
              usuario: usuarioCreado,
              asignacion
            }
          ])
        )
      )
    );
  }
  listarUsuarios(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.apiUrl, {
      headers: this.obtenerHeaders()
    });
  }

  listarRolesUsuario(usuarioId: string): Observable<RolUsuario[]> {
    return this.http.get<RolUsuario[]>(
      `${this.apiUrl}/${usuarioId}/roles`,
      { headers: this.obtenerHeaders() }
    );
  }
}
