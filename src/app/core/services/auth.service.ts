import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Usuario } from '../models/models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _usuario = signal<Usuario | null>(this.readUser());
  private readonly _token = signal<string | null>(this.read(TOKEN_KEY));

  readonly usuario = this._usuario.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  login(credenciales: LoginRequest) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales)
      .pipe(
        tap((res) => {
          this._token.set(res.access_token);
          this._usuario.set(res.usuario);
          this.write(TOKEN_KEY, res.access_token);
          this.write(USER_KEY, JSON.stringify(res.usuario));
        }),
      );
  }

  logout(): void {
    this._token.set(null);
    this._usuario.set(null);
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch {}
    this.router.navigate(['/login']);
  }

  private readUser(): Usuario | null {
    const raw = this.read(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }

  private read(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {}
  }
}
