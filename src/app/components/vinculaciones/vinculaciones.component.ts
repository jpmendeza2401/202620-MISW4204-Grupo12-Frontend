
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  VinculacionesService,
  Vinculacion,
  CrearVinculacionRequest
} from '../../services/vinculaciones.service';
import { UsuarioResponse, UsuarioService } from '../../core/services/user.service';

// import {
//   UsuarioService,
//   UsuarioResponse
// } from '../../services/usuario.service';

@Component({
  selector: 'app-vinculaciones',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './vinculaciones.component.html',
  styleUrl: './vinculaciones.component.css'
})
export class VinculacionesComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly vinculacionesService = inject(VinculacionesService);
  private cdr = inject(ChangeDetectorRef);

  espacioId: string | null = null;

  vinculaciones: Vinculacion[] = [];

  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';
  mostrarFormulario = false;

private readonly usuarioService = inject(UsuarioService);

usuarios: UsuarioResponse[] = [];
cargandoUsuarios = false;
  
  nuevaVinculacion = {
    usuario_id: '',
    rol_operativo: 'monitor' as 'monitor' | 'asistente_graduado',
    horas_contratadas: null as number | null
  };

  ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    const id = params.get('id');

    if (!id || !id.trim()) {
      this.espacioId = null;
      this.error = 'El identificador del espacio académico no es válido.';
      return;
    }

    this.espacioId = id;
    this.error = '';

    this.listarVinculaciones();
    this.listarUsuarios();
  });
}

listarVinculaciones(): void {
  if (!this.espacioId) return;

  this.cargando = true;
  this.error = '';

  this.vinculacionesService.listarPorEspacio(this.espacioId).subscribe({
    next: (respuesta) => {
      this.vinculaciones = respuesta ?? [];
      this.cargando = false;
      this.cdr.markForCheck();
    },
    error: (err) => {
      this.error = err.error?.error ||
        'No fue posible consultar las vinculaciones.';
      this.cargando = false;
      this.cdr.markForCheck();
    }
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
      usuario_id: '',
      rol_operativo: 'monitor',
      horas_contratadas: null
    };
  }

  crearVinculacion(): void {
  this.error = '';
  this.mensaje = '';

    console.log('Usuario ID:', this.nuevaVinculacion.usuario_id);
  console.log('Rol operativo:', this.nuevaVinculacion.rol_operativo);
  console.log('Horas contratadas:', this.nuevaVinculacion.horas_contratadas);
  console.log('Espacio académico ID:', this.espacioId);

  const usuarioId = String(
    this.nuevaVinculacion.usuario_id ?? ''
  ).trim();

  if (!usuarioId) {
    this.error = 'Ingresa un identificador de usuario válido.';
    return;
  }

  const horas = Number(this.nuevaVinculacion.horas_contratadas);

  if (!Number.isFinite(horas) || horas <= 0) {
    this.error = 'Las horas contratadas deben ser mayores a cero.';
    return;
  }

  if (!this.espacioId) {
    this.error = 'No se encontró el espacio académico.';
    return;
  }

  const request: CrearVinculacionRequest = {
    usuario_id: usuarioId,
    espacio_academico_id: this.espacioId,
    rol_operativo: this.nuevaVinculacion.rol_operativo,
    horas_contratadas: horas
  };

  this.guardando = true;

  this.vinculacionesService.crear(request).subscribe({
    next: () => {
      this.guardando = false;
      this.mensaje = 'La vinculación fue creada correctamente.';

      this.limpiarFormulario();
      this.mostrarFormulario = false;

      this.listarVinculaciones();
      this.cdr.markForCheck();
    },
    error: (err) => {
      this.guardando = false;
      this.error = err.error?.error ||
        'No fue posible crear la vinculación.';

      this.cdr.markForCheck();
    }
  });
}

listarUsuarios(): void {
  this.cargandoUsuarios = true;

  this.usuarioService.listarUsuarios().subscribe({
    next: (respuesta) => {
      this.usuarios = respuesta ?? [];
      this.cargandoUsuarios = false;
      this.cdr.markForCheck();

      console.log('Usuarios disponibles:', this.usuarios);
    },
    error: (err) => {
      this.cargandoUsuarios = false;
      this.error = err.error?.error || 'No fue posible consultar los usuarios.';
      this.cdr.markForCheck();
    }
  });
}

}
