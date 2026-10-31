
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Vinculacion {
  id: number;
  usuario_id: number;
  espacio_academico_id: number;
  rol_operativo: 'monitor' | 'asistente_graduado';
  horas_contratadas: number;
  fecha_creacion: string;
}

@Component({
  selector: 'app-vinculaciones',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './vinculaciones.component.html',
  styleUrl: './vinculaciones.component.css'
})
export class VinculacionesComponent implements OnInit {

  espacioId: number | null = null;

  vinculaciones: Vinculacion[] = [];

  cargando = false;
  error = '';
  mensaje = '';
  mostrarFormulario = false;

  nuevaVinculacion = {
    usuario_id: null as number | null,
    rol_operativo: 'monitor' as 'monitor' | 'asistente_graduado',
    horas_contratadas: null as number | null
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));

      if (!Number.isInteger(id) || id <= 0) {
        this.espacioId = null;
        this.error = 'El identificador del espacio académico no es válido.';
        return;
      }

      this.espacioId = id;
      this.error = '';
    });
  }

  get totalMonitores(): number {
    return this.vinculaciones.filter(
      v => v.rol_operativo === 'monitor'
    ).length;
  }

  get totalAsistentes(): number {
    return this.vinculaciones.filter(
      v => v.rol_operativo === 'asistente_graduado'
    ).length;
  }

  get totalHoras(): number {
    return this.vinculaciones.reduce(
      (total, v) => total + v.horas_contratadas,
      0
    );
  }

  abrirFormulario(): void {
    this.mensaje = '';
    this.error = '';
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
  }

  limpiarFormulario(): void {
    this.nuevaVinculacion = {
      usuario_id: null,
      rol_operativo: 'monitor',
      horas_contratadas: null
    };
  }

  crearVinculacion(): void {
    this.error = '';
    this.mensaje = '';

    if (
      !this.nuevaVinculacion.usuario_id ||
      this.nuevaVinculacion.usuario_id <= 0
    ) {
      this.error = 'Ingresa un identificador de usuario válido.';
      return;
    }

    if (
      !this.nuevaVinculacion.horas_contratadas ||
      this.nuevaVinculacion.horas_contratadas <= 0
    ) {
      this.error = 'Las horas contratadas deben ser mayores a cero.';
      return;
    }

    if (!this.espacioId) {
      this.error = 'No se encontró el espacio académico.';
      return;
    }

    // Pendiente: enviar la solicitud al backend con el JWT.
    this.mensaje = 'Los datos son válidos. La integración con el backend está pendiente.';

    console.log('Datos de la nueva vinculación:', {
      usuario_id: this.nuevaVinculacion.usuario_id,
      espacio_academico_id: this.espacioId,
      rol_operativo: this.nuevaVinculacion.rol_operativo,
      horas_contratadas: this.nuevaVinculacion.horas_contratadas
    });
  }
}
