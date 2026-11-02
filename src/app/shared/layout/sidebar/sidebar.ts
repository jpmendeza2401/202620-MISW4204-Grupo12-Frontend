import { Component, input, output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly abierto = input(false);
  readonly cerrar = output<void>();
   cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
