import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import {UsuarioService, UsuarioResponse, RolUsuario} from '../../../core/services/user.service';
import { RouterLink } from '@angular/router';

interface UsuarioDirectorio extends UsuarioResponse {
  roles: RolUsuario[];
}

@Component({
  selector: 'app-list',
  imports: [RouterLink],
  templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);

  protected readonly usuarios = signal<UsuarioDirectorio[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');

  protected readonly totalUsuarios = computed(
    () => this.usuarios().length
  );

  protected readonly totalMonitores = computed(
    () => this.contarPorRol(3)
  );

  protected readonly totalAsistentes = computed(
    () => this.contarPorRol(4)
  );

  protected readonly totalDocentes = computed(
    () => this.contarPorRol(2)
  );

  protected readonly usuariosFiltrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();

    if (!termino) {
      return this.usuarios();
    }

    return this.usuarios().filter(usuario =>
      usuario.nombre.toLowerCase().includes(termino) ||
      usuario.correo.toLowerCase().includes(termino) ||
      usuario.identificador.toLowerCase().includes(termino)
    );
  });

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  protected cargarUsuarios(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.usuarioService.listarUsuarios().pipe(
      switchMap(usuarios => {
        if (usuarios.length === 0) {
          return of([]);
        }

        const consultas = usuarios.map(usuario =>
          this.usuarioService.listarRolesUsuario(usuario.id).pipe(
            map(roles => ({
              ...usuario,
              roles
            })),
            catchError(() =>
              of({
                ...usuario,
                roles: []
              })
            )
          )
        );

        return forkJoin(consultas);
      }),
      finalize(() => this.cargando.set(false))
    ).subscribe({
      next: usuarios => {
        this.usuarios.set(usuarios);
      },
      error: () => {
        this.error.set('No fue posible cargar el directorio de usuarios.');
      }
    });
  }

  protected actualizarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  protected limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  private contarPorRol(rolId: number): number {
    return this.usuarios().filter(usuario =>
      usuario.roles.some(rol => rol.id === rolId)
    ).length;
  }
}