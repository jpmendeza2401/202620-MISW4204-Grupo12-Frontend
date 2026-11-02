
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { switchMap, finalize } from 'rxjs';
import { ReporteSemanal } from '../../core/models/reporte.models';
import {
  ReporteService
} from '../../core/services/reporte.service';

type FiltroReporte = 'all' | 'processing' | 'completed' | 'failed';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportsIA.component.html'
})
export class ReportsIAComponent implements OnInit {
  private readonly reporteService = inject(ReporteService);
  private readonly cdr = inject(ChangeDetectorRef);
  reportes: ReporteSemanal[] = [];
  reportesFiltrados: ReporteSemanal[] = [];

  fechaSemana = '';
  terminoBusqueda = '';
  filtroActivo: FiltroReporte = 'all';

  modalAbierto = false;
  cargando = false;
  cargandoListado = false;
  descargandoId: string | null = null;

  mensajeToast = '';
  tipoToast: 'success' | 'error' = 'success';
  errorMensaje = '';
  generandoReporte = false;
  ngOnInit(): void {
    this.listarReportes();
  }

  get totalReportes(): number {
    return this.reportes.length;
  }

  get reportesCompletados(): number {
    return this.reportes.filter(r => this.normalizarEstado(r.estado) === 'completed').length;
  }

  get reportesEnProceso(): number {
    return this.reportes.filter(r => this.normalizarEstado(r.estado) === 'processing').length;
  }

  get reportesFallidos(): number {
    return this.reportes.filter(r => this.normalizarEstado(r.estado) === 'failed').length;
  }

  listarReportes(): void {
    this.cargandoListado = true;
    this.cdr.markForCheck();

    this.reporteService.listarReportesSemanales()
      .pipe(
        finalize(() => {
          this.cargandoListado = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: respuesta => {
          console.log('Respuesta del backend:', respuesta);

          this.reportes = respuesta.reportes ?? [];
          this.aplicarFiltros();

          console.log('Reportes filtrados:', this.reportesFiltrados);

          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Error cargando reportes:', error);

          this.reportes = [];
          this.aplicarFiltros();

          this.mostrarError(
            error,
            'No fue posible cargar los reportes.'
          );

          this.cdr.markForCheck();
        }
      });
  }

  abrirModal(): void {
    this.errorMensaje = '';
    this.fechaSemana = this.obtenerInicioSemanaActual();
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    if (!this.cargando) {
      this.modalAbierto = false;
      this.errorMensaje = '';
    }
  }

  solicitarReporte(): void {

    if (!this.fechaSemana) {
      this.errorMensaje = 'Selecciona la fecha de inicio de la semana.';
      return;
    }

    if (this.generandoReporte) {
      return;
    }

    const datos = {
      semana_inicio: `${this.fechaSemana}T00:00:00Z`
    };

    this.generandoReporte = true;
    this.modalAbierto = false;
    this.errorMensaje = '';

    this.mostrarToast(
      'La generación del reporte comenzó. Puedes seguir utilizando la aplicación.',
      'success'
    );

    this.reporteService.solicitarReporteSemanal(datos).pipe(
      switchMap(respuesta =>
        this.reporteService.analizarReporteSemanal(respuesta.reporte.id)
      ),
      switchMap(respuesta =>
        this.reporteService.generarPdfReporteSemanal(respuesta.reporte_id)
      ),
      switchMap(() =>
        this.reporteService.listarReportesSemanales()
      ),
      finalize(() => {
        this.generandoReporte = false;
      })
    ).subscribe({
      next: respuesta => {
        this.reportes = respuesta.reportes ?? [];
        this.aplicarFiltros();

        this.mostrarToast(
          'El reporte semanal se generó correctamente.',
          'success'
        );
      },
      error: error => {
        this.mostrarToast(
          error.error?.mensaje ??
          'Ocurrió un error durante la generación del reporte.',
          'error'
        );
      }
    });
  }

  descargarPdf(reporte: ReporteSemanal): void {
    if (!reporte.ruta_pdf || this.descargandoId) {
      return;
    }

    this.descargandoId = reporte.id;

    this.reporteService.descargarPdfReporteSemanal(reporte.id)
      .pipe(finalize(() => this.descargandoId = null))
      .subscribe({
        next: archivo => {
          const url = window.URL.createObjectURL(archivo);
          const enlace = document.createElement('a');

          enlace.href = url;
          enlace.download = `reporte-semanal-${reporte.id}.pdf`;
          enlace.click();

          window.URL.revokeObjectURL(url);
        },
        error: error => {
          this.mostrarError(error, 'No fue posible descargar el PDF.');
        }
      });
  }

  cambiarFiltro(filtro: FiltroReporte): void {
    this.filtroActivo = filtro;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    const termino = this.terminoBusqueda.trim().toLowerCase();

    this.reportesFiltrados = this.reportes.filter(reporte => {
      const coincideFiltro =
        this.filtroActivo === 'all' ||
        this.normalizarEstado(reporte.estado) === this.filtroActivo;
      const coincideBusqueda =
        !termino ||
        [
          reporte.id,
          reporte.usuario_id,
          reporte.semana_inicio,
          reporte.semana_fin,
          reporte.estado
        ]
          .join(' ')
          .toLowerCase()
          .includes(termino);

      return coincideFiltro && coincideBusqueda;
    });
  }

  normalizarEstado(estado: string): FiltroReporte {
    const valor = estado?.toLowerCase();

    if (['completed', 'completado', 'completada'].includes(valor)) {
      return 'completed';
    }

    if (['failed', 'fallido', 'fallida', 'error'].includes(valor)) {
      return 'failed';
    }

    return 'processing';
  }

  etiquetaEstado(estado: string): string {
    const normalizado = this.normalizarEstado(estado);

    if (normalizado === 'completed') return 'Completed';
    if (normalizado === 'failed') return 'Failed';

    return 'Processing';
  }

  fechaFormato(fecha: string): string {
    if (!fecha) return 'Fecha no disponible';

    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(fecha));
  }

  semanaFormato(reporte: ReporteSemanal): string {
    return `${this.fechaFormato(reporte.semana_inicio)} - ${this.fechaFormato(reporte.semana_fin)}`;
  }

  private obtenerUsuarioId(): string | null {
    const usuarioGuardado =
      sessionStorage.getItem('auth_user') ??
      localStorage.getItem('auth_user');

    if (!usuarioGuardado) return null;

    try {
      const usuario = JSON.parse(usuarioGuardado);

      return usuario.id ??
        usuario.usuario_id ??
        usuario.usuario?.id ??
        usuario.usuario?.usuario_id ??
        null;
    } catch {
      return null;
    }
  }

  private obtenerInicioSemanaActual(): string {
    const fecha = new Date();
    const dia = fecha.getDay();
    const diferencia = dia === 0 ? 6 : dia - 1;

    fecha.setDate(fecha.getDate() - diferencia);

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const diaMes = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${diaMes}`;
  }

  private mostrarToast(
    mensaje: string,
    tipo: 'success' | 'error'
  ): void {
    this.mensajeToast = mensaje;
    this.tipoToast = tipo;

    setTimeout(() => {
      this.mensajeToast = '';
    }, 3500);
  }

  private mostrarError(error: HttpErrorResponse, mensajePredeterminado: string): void {
    const mensaje =
      error.error?.mensaje ??
      error.error?.message ??
      mensajePredeterminado;

    this.errorMensaje = mensaje;
    this.mostrarToast(mensaje, 'error');
  }
}
