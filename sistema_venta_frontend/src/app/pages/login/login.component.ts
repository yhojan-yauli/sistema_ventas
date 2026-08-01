import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="login-wrap">
      <div class="brand-panel">
        <div class="brand-inner">
          <div class="brand-logo">
            <app-icon name="cash-register" [size]="30" />
            <span>Tienda</span>
          </div>
          <h1>Controla tu tienda<br />desde un solo lugar</h1>
          <p>
            Ventas, cajas, stock y reportes en tiempo real. Todo lo que tu negocio necesita
            para crecer con orden.
          </p>
          <ul class="brand-points">
            <li><app-icon name="check" [size]="15" /> Punto de venta ágil y sin fricciones</li>
            <li><app-icon name="check" [size]="15" /> Cajas por turno con cuadre por método de pago</li>
            <li><app-icon name="check" [size]="15" /> Stock, compras y ganancias siempre claras</li>
          </ul>
          <div class="brand-foot">Sistema de Ventas · v1.0</div>
        </div>
      </div>

      <div class="form-panel">
        <div class="form-card">
          <h2>Bienvenido de nuevo</h2>
          <p class="form-sub">Ingresa tus credenciales para continuar</p>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="field">
              <label class="label" for="username">Usuario</label>
              <div class="input-icon">
                <app-icon name="user" [size]="17" />
                <input
                  class="input"
                  id="username"
                  type="text"
                  formControlName="username"
                  placeholder="Tu nombre de usuario"
                  autocomplete="username"
                  autofocus
                />
              </div>
            </div>
            <div class="field">
              <label class="label" for="password">Contraseña</label>
              <div class="input-icon">
                <app-icon name="key" [size]="17" />
                <input
                  class="input"
                  id="password"
                  [type]="showPass() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Tu contraseña"
                  autocomplete="current-password"
                />
                <button type="button" class="pass-toggle" (click)="showPass.set(!showPass())" aria-label="Mostrar contraseña">
                  <app-icon [name]="showPass() ? 'eye' : 'eye'" [size]="17" />
                </button>
              </div>
            </div>

            @if (error()) {
              <div class="login-error">
                <app-icon name="alert" [size]="16" />
                {{ error() }}
              </div>
            }

            <button class="btn btn-primary btn-block btn-lg" type="submit" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner"></span> Ingresando…
              } @else {
                Ingresar
              }
            </button>
          </form>

          <div class="demo-hint">
            <app-icon name="info" [size]="15" />
            <div>
              <b>Demo:</b> admin / admin123 · vendedor / vendedor123
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-wrap {
        display: grid;
        grid-template-columns: 1.05fr 1fr;
        min-height: 100vh;
      }

      .brand-panel {
        background:
          radial-gradient(1000px 500px at -10% -20%, rgba(13, 148, 136, 0.35), transparent 60%),
          radial-gradient(900px 500px at 110% 110%, rgba(245, 158, 11, 0.18), transparent 55%),
          linear-gradient(160deg, #0e1f24 0%, #123038 55%, #0d252b 100%);
        color: #fff;
        display: flex;
        align-items: center;
        padding: 48px 60px;
        position: relative;
        overflow: hidden;
      }

      .brand-panel::after {
        content: '';
        position: absolute;
        inset: 0;
        background-image: radial-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px);
        background-size: 26px 26px;
        pointer-events: none;
      }

      .brand-inner {
        position: relative;
        z-index: 1;
        max-width: 460px;
      }

      .brand-logo {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.14);
        padding: 10px 18px;
        border-radius: 12px;
        font-weight: 800;
        font-size: 16px;
        margin-bottom: 40px;
        backdrop-filter: blur(4px);
      }

      .brand-logo app-icon {
        color: #5eead4;
      }

      .brand-inner h1 {
        color: #fff;
        font-size: 38px;
        line-height: 1.15;
        letter-spacing: -0.03em;
        margin-bottom: 18px;
      }

      .brand-inner > p {
        color: rgba(255, 255, 255, 0.72);
        font-size: 15.5px;
        line-height: 1.6;
        margin-bottom: 30px;
      }

      .brand-points {
        list-style: none;
        margin: 0 0 36px;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .brand-points li {
        display: flex;
        align-items: center;
        gap: 10px;
        color: rgba(255, 255, 255, 0.85);
        font-size: 14px;
      }

      .brand-points app-icon {
        color: #5eead4;
      }

      .brand-foot {
        color: rgba(255, 255, 255, 0.45);
        font-size: 12.5px;
      }

      .form-panel {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg);
        padding: 32px;
      }

      .form-card {
        width: min(400px, 100%);
      }

      .form-card h2 {
        font-size: 26px;
        margin-bottom: 6px;
      }

      .form-sub {
        color: var(--text-soft);
        margin-bottom: 30px;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .input-icon {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-icon > app-icon {
        position: absolute;
        left: 13px;
        color: var(--text-faint);
        pointer-events: none;
      }

      .input-icon .input {
        padding-left: 40px;
      }

      .input-icon .input[type='password'] {
        padding-right: 44px;
      }

      .pass-toggle {
        position: absolute;
        right: 6px;
        border: 0;
        background: transparent;
        color: var(--text-faint);
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
      }

      .pass-toggle:hover {
        background: var(--bg);
        color: var(--text);
      }

      .login-error {
        display: flex;
        align-items: center;
        gap: 9px;
        background: var(--danger-soft);
        color: #b91c1c;
        font-weight: 600;
        font-size: 13px;
        padding: 11px 14px;
        border-radius: var(--radius-sm);
        border: 1px solid #fecaca;
      }

      .demo-hint {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        margin-top: 26px;
        padding: 13px 15px;
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: var(--radius-sm);
        color: #92400e;
        font-size: 12.5px;
        line-height: 1.5;
      }

      .demo-hint app-icon {
        color: #d97706;
        margin-top: 1px;
      }

      @media (max-width: 900px) {
        .login-wrap {
          grid-template-columns: 1fr;
        }
        .brand-panel {
          display: none;
        }
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPass = signal(false);

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe({
      next: () => {
        this.auth.me().subscribe({
          next: () => {
            this.loading.set(false);
            this.router.navigate(['/']);
          },
          error: () => {
            this.loading.set(false);
            this.router.navigate(['/']);
          },
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(errorMessage(err));
        this.toast.error(errorMessage(err));
      },
    });
  }
}
