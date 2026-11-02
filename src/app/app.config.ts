import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash routing: el bucket GCS solo sirve index.html, no hace fallback de rutas.
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};