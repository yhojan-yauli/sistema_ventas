import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, MeResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(localStorage.getItem('sv_token'));
  readonly user = signal<MeResponse | null>(null);

  get isAdmin(): boolean {
    return this.user()?.rol === 'ADMIN';
  }

  get nombre(): string {
    return this.user()?.nombre ?? '';
  }

  login(username: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap((res) => {
          localStorage.setItem('sv_token', res.token);
          this.token.set(res.token);
          this.user.set({
            id: 0,
            username: res.username,
            nombre: res.nombre,
            email: null,
            rol: res.rol,
            activo: true,
          });
        })
      );
  }

  me() {
    return this.http.get<MeResponse>(`${environment.apiUrl}/auth/me`).pipe(
      tap((u) => this.user.set(u))
    );
  }

  clear() {
    localStorage.removeItem('sv_token');
    this.token.set(null);
    this.user.set(null);
  }

  logout() {
    this.clear();
    this.router.navigate(['/login']);
  }
}
