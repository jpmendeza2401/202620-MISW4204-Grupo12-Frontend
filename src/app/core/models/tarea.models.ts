/** Estados válidos de una tarea (RN-27, RN-28). */
export type EstadoTarea = 'abierto' | 'en_desarrollo' | 'finalizado';

export const ESTADOS_TAREA: { valor: EstadoTarea; etiqueta: string }[] = [
  { valor: 'abierto', etiqueta: 'Abierto' },
  { valor: 'en_desarrollo', etiqueta: 'En desarrollo' },
  { valor: 'finalizado', etiqueta: 'Finalizado' },
];

/** Respuesta de la API para una tarea (RF-06). Las fechas van como YYYY-MM-DD. */
export interface Tarea {
  id: string;
  vinculacion_id: string;
  estado: EstadoTarea;
  titulo: string;
  descripcion: string;
  horas_invertidas: number;
  observaciones: string | null;
  semana_inicio: string;
  semana_fin: string;
  es_tardia: boolean;
}

/** Cuerpo de POST /tareas. `semana` es opcional: si falta, la API usa la semana en curso. */
export interface CrearTareaRequest {
  vinculacion_id: string;
  titulo: string;
  descripcion: string;
  estado: EstadoTarea;
  horas_invertidas: number;
  observaciones: string | null;
  semana?: string;
}

/** Cuerpo de PUT /tareas/{id}. No permite cambiar la vinculación ni la semana (RN-21, RN-26). */
export interface ActualizarTareaRequest {
  titulo: string;
  descripcion: string;
  estado: EstadoTarea;
  horas_invertidas: number;
  observaciones: string | null;
}
