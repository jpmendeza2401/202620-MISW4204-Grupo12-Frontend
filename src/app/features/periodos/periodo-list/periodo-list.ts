import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Periodo, PeriodoFiltro } from '../../../core/models/models';
import { PeriodoService } from '../../../core/services/periodo.service';

type EstadoFiltro = '' | 'true' | 'false';

@Component({
  selector: 'app-periodo-list',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './periodo-list.html',
})
export class PeriodoList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly periodoService = inject(PeriodoService);

  protected readonly periodos = signal<Periodo[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly filtros = this.fb.nonNullable.group({
    codigo: [''],
    habilitado: ['' as EstadoFiltro],
    vigente: ['' as EstadoFiltro],
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    const { codigo, habilitado, vigente } = this.filtros.getRawValue();
    const filtro: PeriodoFiltro = { codigo };
    if (habilitado) filtro.habilitado = habilitado === 'true';
    if (vigente) filtro.vigente = vigente === 'true';

    this.cargando.set(true);
    this.error.set(null);
    this.periodoService.listar(filtro).subscribe({
      next: (res) => {
        this.periodos.set(res.periodos ?? []);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.periodos.set([]);
        this.cargando.set(false);
        this.error.set(this.mensaje(err));
      },
    });
  }

  protected limpiar(): void {
    this.filtros.reset({ codigo: '', habilitado: '', vigente: '' });
    this.cargar();
  }

  private mensaje(err: HttpErrorResponse): string {
    if (err.status === 0) return 'No se pudo conectar con el servidor';
    if (err.status === 401) return 'Sesión expirada. Inicia sesión nuevamente';
    return err.error?.error ?? 'Error al consultar los periodos';
  }
}
