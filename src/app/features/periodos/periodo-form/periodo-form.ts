import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { PeriodoService } from '../../../core/services/periodo.service';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function fechaFinPosterior(group: AbstractControl): ValidationErrors | null {
  const inicio = group.get('fecha_inicio')?.value;
  const fin = group.get('fecha_fin')?.value;
  return inicio && fin && fin < inicio ? { fechaFinAnterior: true } : null;
}

@Component({
  selector: 'app-periodo-form',
  imports: [ReactiveFormsModule],
  templateUrl: './periodo-form.html',
})
export class PeriodoForm {
  private readonly fb = inject(FormBuilder);
  private readonly periodos = inject(PeriodoService);

  protected readonly guardando = signal(false);
  protected readonly exito = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      codigo: ['', [Validators.required, Validators.maxLength(40)]],
      fecha_inicio: ['', Validators.required],
      fecha_fin: ['', Validators.required],
      habilitado: [true],
    },
    { validators: fechaFinPosterior },
  );

  private readonly valores = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly semanas = computed(() => {
    const { fecha_inicio, fecha_fin } = this.valores();
    if (!fecha_inicio || !fecha_fin) return null;
    const dias = (Date.parse(fecha_fin) - Date.parse(fecha_inicio)) / MS_POR_DIA + 1;
    return dias > 0 ? Math.ceil(dias / 7) : null;
  });

  protected guardar(): void {
    this.exito.set(null);
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    this.guardando.set(true);
    this.periodos.crear({ ...valor, codigo: valor.codigo.trim() }).subscribe({
      next: (p) => {
        this.guardando.set(false);
        this.exito.set(`Periodo ${p.codigo} creado correctamente`);
        this.form.reset({ codigo: '', fecha_inicio: '', fecha_fin: '', habilitado: true });
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(this.mensaje(err));
      },
    });
  }

  protected cancelar(): void {
    this.form.reset({ codigo: '', fecha_inicio: '', fecha_fin: '', habilitado: true });
    this.exito.set(null);
    this.error.set(null);
  }

  protected invalido(campo: 'codigo' | 'fecha_inicio' | 'fecha_fin'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && c.touched;
  }

  private mensaje(err: HttpErrorResponse): string {
    if (err.status === 0) return 'No se pudo conectar con el servidor';
    if (err.status === 403) return 'No tienes permisos para crear periodos';
    return err.error?.error ?? 'Error al crear el periodo';
  }
}
