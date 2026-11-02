
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, switchMap, of, map, Observable } from 'rxjs';

import {
  UsuarioService,
  UsuarioResponse,
  RolUsuario
} from '../../../core/services/user.service';

@Component({
  selector: 'app-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './update.component.html'
})
export class UpdateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);

  usuarioId = signal('');
  usuario = signal<UsuarioResponse | null>(null);
  roles = signal<RolUsuario[]>([]);

  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  mensaje = signal('');

  rolActualId = signal<number | null>(null);

  rolesDisponibles = [
    { id: 2, nombre: 'Docente', descripcion: 'Aprobación de horas y supervisión de cátedra', icono: 'supervised_user_circle' },
    { id: 3, nombre: 'Monitor', descripcion: 'Gestión de bitácoras y horas de soporte', icono: 'assignment_ind' },
    { id: 4, nombre: 'Asistente', descripcion: 'Co-docencia, evaluación y asesoría', icono: 'school' }
  ];

  formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    correo: ['', [Validators.required, Validators.email]],
    identificador: ['', Validators.required],
    rolId: [0, Validators.required]
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (!id) {
        this.error.set('No se recibió el identificador del usuario.');
        this.cargando.set(false);
        return;
      }

      this.usuarioId.set(id);
      this.cargarUsuario();
    });
  }

  cargarUsuario(): void {
    this.cargando.set(true);
    this.error.set('');
    this.mensaje.set('');

    forkJoin({
      usuario: this.usuarioService.obtenerUsuario(this.usuarioId()),
      roles: this.usuarioService.listarRolesUsuario(this.usuarioId())
    }).subscribe({
      next: ({ usuario, roles }) => {
        this.usuario.set(usuario);
        this.roles.set(roles);

        const rolInstitucional = roles.find(rol =>
          [2, 3, 4].includes(rol.id)
        );

        this.rolActualId.set(rolInstitucional?.id ?? null);

        this.formulario.patchValue({
          nombre: usuario.nombre,
          correo: usuario.correo,
          identificador: usuario.identificador,
          rolId: rolInstitucional?.id ?? 0
        });

        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar la información del usuario.');
        this.cargando.set(false);
      }
    });
  }

  obtenerIniciales(): string {
    const nombre = this.usuario()?.nombre ?? '';

    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(parte => parte.charAt(0).toUpperCase())
      .join('');
  }

  obtenerNombreRol(rolId: number): string {
    return this.rolesDisponibles.find(rol => rol.id === rolId)?.nombre
      ?? 'Sin rol institucional';
  }

  obtenerNombreRolActual(): string {
    const rolId = this.rolActualId();
    return rolId ? this.obtenerNombreRol(rolId) : 'Sin rol institucional';
  }

  descartarCambios(): void {
    const usuario = this.usuario();

    if (!usuario) {
      return;
    }

    this.formulario.patchValue({
      nombre: usuario.nombre,
      correo: usuario.correo,
      identificador: usuario.identificador,
      rolId: this.rolActualId() ?? 0
    });

    this.mensaje.set('');
    this.error.set('');
  }

  guardarCambios(): void {
    if (this.formulario.invalid || this.guardando()) {
      this.formulario.markAllAsTouched();
      return;
    }

    const usuarioId = this.usuarioId();
    const rolAnterior = this.rolActualId();
    const datos = this.formulario.getRawValue();
    const nuevoRol = Number(datos.rolId);

    if (!usuarioId) {
      this.error.set('No se encontró el usuario que deseas actualizar.');
      return;
    }

    if (!nuevoRol) {
      this.error.set('Debes seleccionar un rol institucional.');
      return;
    }

    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');

    this.usuarioService.actualizarUsuario(usuarioId, {
      nombre: datos.nombre,
      correo: datos.correo,
      identificador: datos.identificador
    }).pipe(
      switchMap(usuarioActualizado => {
        let actualizarRol$: Observable<unknown>;

        if (!rolAnterior) {
          actualizarRol$ = this.usuarioService.asignarRol(usuarioId, {
            rol_id: nuevoRol
          });
        } else if (rolAnterior !== nuevoRol) {
          actualizarRol$ = this.usuarioService.desasignarRol(
            usuarioId,
            rolAnterior
          ).pipe(
            switchMap(() =>
              this.usuarioService.asignarRol(usuarioId, {
                rol_id: nuevoRol
              })
            )
          );
        } else {
          actualizarRol$ = of(null);
        }

        return actualizarRol$.pipe(
          switchMap(() =>
            this.usuarioService.listarRolesUsuario(usuarioId)
          ),
          map(roles => ({
            usuario: usuarioActualizado,
            roles
          }))
        );
      })
    ).subscribe({
      next: resultado => {
        this.usuario.set(resultado.usuario);
        this.roles.set(resultado.roles);
        this.rolActualId.set(nuevoRol);

        this.formulario.patchValue({
          nombre: resultado.usuario.nombre,
          correo: resultado.usuario.correo,
          identificador: resultado.usuario.identificador,
          rolId: nuevoRol
        });

        this.mensaje.set('Los datos del usuario se actualizaron correctamente.');
        this.guardando.set(false);
      },
      error: () => {
        this.error.set(
          'No fue posible completar la actualización. Comprueba los datos y los roles asignados. Es posible que los datos generales ya se hayan actualizado.'
        );
        this.guardando.set(false);
      }
    });
  }
}
