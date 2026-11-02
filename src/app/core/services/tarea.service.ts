import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
  ActualizarTareaRequest,
  CrearTareaRequest,
  EstadoTarea,
  Tarea,
} from '../models/tarea.models';

/**
 * Registro semanal de tareas (RF-06). El usuario se toma del token JWT,
 * que agrega el authInterceptor; por eso aquí no se envía ningún ID de usuario.
 */
@Injectable({ providedIn: 'root' })
export class TareaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tareas`;

  /** Tareas propias de una semana. Sin `semana`, la API devuelve la semana en curso. */
  listar(vinculacionId: string, semana?: string) {
    let params = new HttpParams().set('vinculacion_id', vinculacionId);
    if (semana) params = params.set('semana', semana);
    return this.http.get<Tarea[] | null>(this.base, { params });
  }

  crear(tarea: CrearTareaRequest) {
    return this.http.post<Tarea>(this.base, tarea);
  }

  actualizar(id: string, cambios: ActualizarTareaRequest) {
    return this.http.put<Tarea>(`${this.base}/${id}`, cambios);
  }

  cambiarEstado(id: string, estado: EstadoTarea) {
    return this.http.patch<Tarea>(`${this.base}/${id}/estado`, { estado });
  }

  eliminar(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
