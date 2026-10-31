import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'espacios',
    loadComponent: () =>
      import('./components/espacios/espacios.component')
        .then(m => m.EspaciosComponent)
  },
  {
    path: 'espacios/:id/vinculaciones',
    loadComponent: () =>
      import('./components/vinculaciones/vinculaciones.component')
        .then(m => m.VinculacionesComponent)
  },
  {
    path: '',
    redirectTo: 'espacios',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'espacios'
  }
];