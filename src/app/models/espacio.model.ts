export interface EspacioAcademico {
  id: string;
  periodo_academico_id: string;
  profesor_id: string;
  tipo: 'curso' | 'proyecto';
  nombre: string;
  estado: 'activo' | 'cerrado';
  fecha_inicio: string | null;
  fecha_fin: string | null;
  fecha_cierre: string | null;
  observaciones: string;
}

export interface CrearEspacioRequest {
  periodo_academico_id: string;
  tipo: 'curso' | 'proyecto';
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones: string;
}