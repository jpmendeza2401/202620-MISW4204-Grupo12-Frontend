export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  identificador: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  usuario: Usuario;
}

export interface PeriodoCreate {
  codigo: string;
  fecha_inicio: string;
  fecha_fin: string;
  habilitado: boolean;
}

export interface Periodo extends PeriodoCreate {
  id: string;
}
