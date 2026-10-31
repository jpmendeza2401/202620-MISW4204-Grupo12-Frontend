import { Component, inject, output } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
})
export class Header {
  protected readonly usuario = inject(AuthService).usuario;
  readonly alternarMenu = output<void>();
}
