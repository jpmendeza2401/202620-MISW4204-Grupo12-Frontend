
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {UsuarioService, AsignacionRolError} from '../../../core/services/user.service';

type RolInstitucional = 'monitor' | 'asistente_graduado' | 'profesor';

@Component({
  selector: 'app-create',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create.component.html',
})
export class CreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);
  protected readonly passwordVisible = signal(false);
  protected readonly fortaleza = signal(0);

  protected readonly form = this.fb.nonNullable.group({
    rol: ['monitor' as RolInstitucional, Validators.required],
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    identificador: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    aceptaTerminos: [false, Validators.requiredTrue],
  });

  protected actualizarFortaleza(): void {
    const password = this.form.controls.password.value;

    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    this.fortaleza.set(
      password.length === 0 ? 0 : password.length < 8 ? -1 : score
    );
  }

  protected get etiquetaFortaleza(): string {
    const nivel = this.fortaleza();

    if (nivel === 0) return 'Mínimo 8 caracteres';
    if (nivel === -1) return 'Muy corta (< 8 caracteres)';
    if (nivel <= 2) return 'Seguridad media';
    if (nivel === 3) return 'Segura';

    return 'Excelente complejidad';
  }

  protected get claseFortaleza(): string {
    const nivel = this.fortaleza();

    if (nivel === -1) return 'text-error';
    if (nivel <= 2 && nivel > 0) return 'text-primary';
    if (nivel >= 3) return 'text-secondary';

    return 'text-outline';
  }

  protected barraClase(indice: number): string {
    const nivel = this.fortaleza();

    if (nivel === 0) return 'bg-surface-container-high';
    if (nivel === -1) return indice === 0 ? 'bg-error' : 'bg-surface-container-high';
    if (nivel <= 2) return indice < 2 ? 'bg-primary' : 'bg-surface-container-high';
    if (nivel === 3) return indice < 3 ? 'bg-secondary' : 'bg-surface-container-high';

    return 'bg-secondary';
  }

  protected seleccionarRol(rol: RolInstitucional): void {
    this.form.controls.rol.setValue(rol);
  }

  protected registrar(): void {
    if (this.form.invalid || this.cargando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.exito.set(null);
    this.cargando.set(true);

    const { rol, aceptaTerminos, ...datosUsuario } = this.form.getRawValue();

    const roles: Record<RolInstitucional, number> = {
      profesor: 2,
      monitor: 3,
      asistente_graduado: 4
    };
    const datosRol = {
      rol_id: roles[rol]
    };
    this.usuarioService.crearUsuarioConRol(datosUsuario, datosRol)
      .pipe(
        finalize(() => this.cargando.set(false))
      )
      .subscribe({
        next: (resultado) => {
          this.exito.set(
            `El usuario ${resultado.usuario.nombre} fue creado y su rol fue asignado correctamente.`
          );

          this.form.reset({
            rol: 'monitor',
            nombre: '',
            correo: '',
            identificador: '',
            password: '',
            aceptaTerminos: false
          });

          this.fortaleza.set(0);
        },
        error: (err: unknown) => {
          if (err instanceof AsignacionRolError) {
            this.error.set(
              `El usuario fue creado correctamente, pero no se pudo asignar el rol. ID: ${err.usuarioCreado.id}`
            );
            return;
          }

          this.error.set(
            'No fue posible crear el usuario. Verifica los datos e intenta nuevamente.'
          );
        }
      });
  }
}
