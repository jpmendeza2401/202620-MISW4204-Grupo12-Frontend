export interface PersonaVinculada {
  usuario_id: string;
  nombre: string;
  correo: string;
  identificador: string;
  roles: string[] | null;
  vinculacion_id: string;
  rol_operativo: string;
  horas_contratadas: number;
  espacio_academico_id: string;
  espacio_nombre: string;
  espacio_tipo: string;
  espacio_estado: string;
  periodo_academico_id: string;
  periodo_codigo: string;
  total_tareas: number;
  horas_invertidas_total: number;
}

export interface VinculacionPersona {
  vinculacion_id: string;
  rol_operativo: string;
  horas_contratadas: number;
  espacio_academico_id: string;
  espacio_tipo: string;
  espacio_nombre: string;
  espacio_estado: string;
  periodo_id: string;
  periodo_codigo: string;
}

export interface VinculacionesPersona {
  usuario_id: string;
  nombre: string;
  correo: string;
  identificador: string;
  vinculaciones: VinculacionPersona[] | null;
}

export interface TareaBase {
  tarea_id: string;
  titulo: string;
  descripcion: string;
  observaciones: string;
  horas_invertidas: number;
  estado: string;
  semana_inicio: string;
  semana_fin: string;
  es_tardia: boolean;
}

export interface TareaEspacio extends TareaBase {
  usuario_id: string;
  usuario_nombre: string;
  rol_operativo: string;
}

export interface TareasEspacio {
  espacio_academico_id: string;
  espacio_nombre: string;
  espacio_tipo: string;
  espacio_estado: string;
  periodo_id: string;
  periodo_codigo: string;
  tareas: TareaEspacio[] | null;
}

export interface TareaConsolidada extends TareaBase {
  periodo_id: string;
  periodo_codigo: string;
  espacio_academico_id: string;
  espacio_nombre: string;
  espacio_tipo: string;
  rol_operativo: string;
}

export interface TrabajoPersona {
  usuario_id: string;
  nombre: string;
  correo: string;
  identificador: string;
  total_tareas: number;
  total_horas: number;
  tareas: TareaConsolidada[] | null;
}

export interface TareaReportada extends TareaBase {
  usuario_id: string;
  usuario_nombre: string;
  rol_operativo: string;
  espacio_academico_id: string;
  espacio_nombre: string;
  espacio_tipo: string;
  periodo_id: string;
  periodo_codigo: string;
}

export interface VinculacionPropia {
  vinculacion_id: string;
  espacio_academico_id: string;
  espacio_nombre: string;
  espacio_tipo: string;
  rol_operativo: string;
  horas_contratadas: number;
  fecha_creacion: string;
}

export interface MisVinculaciones {
  usuario_id: string;
  nombre: string;
  vinculaciones: VinculacionPropia[] | null;
}

export interface TareaPropia extends TareaBase {
  vinculacion_id: string;
}

export interface HistorialSemana {
  semana_inicio: string;
  semana_fin: string;
  total_tareas: number;
  horas_invertidas: number;
  tareas: TareaPropia[] | null;
}

export interface FiltrosReporte {
  usuario_id?: string;
  espacio_id?: string;
  periodo_id?: string;
}
export interface ReporteSemanal {
  id: string;
  usuario_id: string;
  profesor_generador_id: string;
  semana_inicio: string;
  semana_fin: string;
  fecha_generacion: string;
  estado: string;
  ruta_pdf?: string;
}

export interface ListarReportesResponse {
  reportes: ReporteSemanal[];
  total: number;
}

export interface CrearReporteRequest {
  semana_inicio: string;
}

export interface CrearReporteResponse {
  mensaje: string;
  reporte: ReporteSemanal;
  analisis_ia: {
    id: string;
    reporte_id: string;
    estado: string;
    intentos: number;
    creado_en: string;
    actualizado_en: string;
  };
}

export interface AnalizarReporteResponse {
  estado: string;
  mensaje: string;
  reporte_id: string;
}

export interface GenerarPdfResponse {
  descarga: string;
  mensaje: string;
  reporte_id: string;
  ruta_pdf: string;
}