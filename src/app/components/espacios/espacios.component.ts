
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EspaciosService } from '../../services/espacios.service';
import {
  EspacioAcademico,
  CrearEspacioRequest
} from '../../models/espacio.model';

@Component({
  selector: 'app-espacios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './espacios.component.html',
  styleUrl: './espacios.component.css'
})
export class EspaciosComponent implements OnInit {

  private espaciosService = inject(EspaciosService);

  espacios: EspacioAcademico[] = [];

  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';

  mostrarFormulario = false;
  vista: 'activos' | 'cerrados' = 'activos';
  tipoFiltro: 'todos' | 'curso' | 'proyecto' = 'todos';

  nuevoEspacio: CrearEspacioRequest = this.formularioVacio();

  ngOnInit(): void {
    this.listarEspacios();
  }

  private formularioVacio(): CrearEspacioRequest {
    return {
      periodo_academico_id: '',
      tipo: 'curso',
      nombre: '',
      fecha_inicio: '',
      fecha_fin: '',
      observaciones: ''
    };
  }

  listarEspacios(): void {
    this.cargando = true;
    this.error = '';

    const peticion = this.vista === 'activos'
      ? this.espaciosService.listar()
      : this.espaciosService.listarCerrados();

    peticion.subscribe({
      next: (respuesta) => {
        this.espacios = respuesta ?? [];
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'No fue posible consultar los espacios.';
        this.cargando = false;
      }
    });
  }

  cambiarVista(vista: 'activos' | 'cerrados'): void {
    this.vista = vista;
    this.tipoFiltro = 'todos';
    this.listarEspacios();
  }

  // get espaciosFiltrados(): EspacioAcademico[] {
  //   if (this.tipoFiltro === 'todos') {
  //     return this.espacios;
  //   }

  //   return this.espacios.filter(
  //     espacio => espacio.tipo === this.tipoFiltro
  //   );
  // }

  crearEspacio(): void {
    this.error = '';
    this.mensaje = '';

    if (
      !this.nuevoEspacio.periodo_academico_id.trim() ||
      !this.nuevoEspacio.nombre.trim() ||
      !this.nuevoEspacio.fecha_inicio ||
      !this.nuevoEspacio.fecha_fin
    ) {
      this.error = 'Completa todos los campos obligatorios.';
      return;
    }

    if (this.nuevoEspacio.fecha_fin < this.nuevoEspacio.fecha_inicio) {
      this.error = 'La fecha de finalización no puede ser anterior a la fecha de inicio.';
      return;
    }

    this.guardando = true;

    this.espaciosService.crear(this.nuevoEspacio).subscribe({
      next: () => {
        this.guardando = false;
        this.mensaje = 'El espacio académico fue creado correctamente.';
        this.nuevoEspacio = this.formularioVacio();
        this.mostrarFormulario = false;
        this.cambiarVista('activos');
      },
      error: (err) => {
        this.guardando = false;
        this.error = err.error?.error || 'No fue posible crear el espacio académico.';
      }
    });
  }

  cerrarEspacio(espacio: EspacioAcademico): void {
    const confirmar = window.confirm(
      `¿Estás seguro de cerrar el espacio "${espacio.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    this.error = '';
    this.mensaje = '';

    this.espaciosService.cerrar(espacio.id).subscribe({
      next: () => {
        this.mensaje = 'El espacio académico fue cerrado correctamente.';
        this.listarEspacios();
      },
      error: (err) => {
        this.error = err.error?.error || 'No fue posible cerrar el espacio.';
      }
    });
  }

  abrirFormulario(): void {
    this.error = '';
    this.mensaje = '';
    this.nuevoEspacio = this.formularioVacio();
    this.mostrarFormulario = true;
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.error = '';
    this.nuevoEspacio = this.formularioVacio();
  }

  
busqueda = '';
periodoFiltro = '';

get espaciosFiltrados(): EspacioAcademico[] {
  return this.espacios.filter(espacio => {
    const coincideTipo =
      this.tipoFiltro === 'todos' ||
      espacio.tipo === this.tipoFiltro;

    const texto = this.busqueda.trim().toLowerCase();

    const coincideBusqueda =
      !texto ||
      espacio.nombre.toLowerCase().includes(texto) ||
      espacio.id.toLowerCase().includes(texto);

    const coincidePeriodo =
      !this.periodoFiltro ||
      espacio.periodo_academico_id
        .toLowerCase()
        .includes(this.periodoFiltro.trim().toLowerCase());

    return coincideTipo && coincideBusqueda && coincidePeriodo;
  });
}

formatearFecha(fecha: string | null): string {
  if (!fecha) return 'No definida';

  const partes = fecha.substring(0, 10).split('-');

  if (partes.length !== 3) return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

}
