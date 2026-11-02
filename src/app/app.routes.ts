import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: 'crear-periodo',
        loadComponent: () =>
          import('./features/periodos/periodo-form/periodo-form').then(
            (m) => m.PeriodoForm
          ),
      },
      {
        path: 'mis-tareas',
        loadComponent: () =>
          import('./features/tareas/mis-tareas/mis-tareas').then((m) => m.MisTareas),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/reportes/reportes/reportes').then(
            (m) => m.Reportes
          ),
      },
      {
        path: 'usuarios/:id',
        loadComponent: () =>
          import('./features/user/update/update.component').then(
            (m) => m.UpdateComponent
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/user/create/create.component').then(
            (m) => m.CreateComponent
          ),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/user/list/list.component').then(
            (m) => m.ListComponent
          ),
      },

      // Módulo de espacios académicos
      {
        path: 'espacios',
        loadComponent: () =>
          import('./components/espacios/espacios.component').then(
            (m) => m.EspaciosComponent
          ),
      },
      {
        path: 'espacios/:id/vinculaciones',
        loadComponent: () =>
          import('./components/vinculaciones/vinculaciones.component').then(
            (m) => m.VinculacionesComponent
          ),
      },

      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'crear-periodo',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];