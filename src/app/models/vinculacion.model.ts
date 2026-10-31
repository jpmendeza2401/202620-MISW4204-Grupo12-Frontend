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