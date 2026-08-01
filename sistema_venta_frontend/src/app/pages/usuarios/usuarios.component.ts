import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Rol, UsuarioResponse } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { ROLES, date, errorMessage, rolLabel } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent, ModalFooterDirective } from '../../shared/modal.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, ModalComponent, ModalFooterDirective],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Usuarios</h1>
          <p class="page-sub">Accesos al sistema y roles de trabajo</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" (click)="openForm()"><app-icon name="plus" [size]="16" /> Nuevo usuario</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-block"><app-icon name="refresh" [size]="26" /></div>
      } @else {
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Username</th>
                <th>Rol</th>
                <th>Email</th>
                <th>Registrado</th>
                <th>Estado</th>
                <th class="right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (u of usuarios(); track u.id) {
                <tr>
                  <td>
                    <div class="usr-name">
                      <span class="avatar" [class.is-self]="u.id === me?.id">{{ u.nombre.charAt(0) }}</span>
                      <b>{{ u.nombre }}</b>
                      @if (u.id === me?.id) {
                        <span class="badge badge-brand">Tú</span>
                      }
                    </div>
                  </td>
                  <td class="code">{{ u.username }}</td>
                  <td>
                    <span class="badge" [class.badge-brand]="u.rol === 'ADMIN'" [class.badge-neutral]="u.rol === 'VENDEDOR'">
                      {{ rolLabel(u.rol) }}
                    </span>
                  </td>
                  <td>{{ u.email ?? '—' }}</td>
                  <td>{{ date(u.fechaCreacion) }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="u.activo" [class.badge-danger]="!u.activo">
                      {{ u.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <div class="actions">
                      <button class="icon-action" (click)="openForm(u)" title="Editar"><app-icon name="pencil" [size]="15" /></button>
                      <button class="icon-action" (click)="openPassword(u)" title="Cambiar contraseña"><app-icon name="key" [size]="15" /></button>
                      @if (u.id !== me?.id) {
                        <button class="icon-action" (click)="toggleActivo(u)" [title]="u.activo ? 'Desactivar' : 'Activar'">
                          <app-icon name="power" [size]="15" />
                          <span class="pwr">{{ u.activo ? 'off' : 'on' }}</span>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Formulario crear/editar -->
    <app-modal [open]="formOpen()" (closed)="closeForm()">
      <span head>{{ editando() ? 'Editar usuario' : 'Nuevo usuario' }}</span>
      <form [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="form-grid">
          <div class="field">
            <label class="label">Nombre completo <span class="opt">obligatorio</span></label>
            <input class="input" formControlName="nombre" placeholder="Ej. Juan Pérez" />
            @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
              <span class="field-err">El nombre es obligatorio</span>
            }
          </div>
          <div class="field">
            <label class="label">Rol</label>
            <select class="select" formControlName="rol">
              @for (r of roles; track r.value) {
                <option [value]="r.value">{{ r.label }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label class="label">Username <span class="opt">obligatorio</span></label>
            <input class="input" formControlName="username" placeholder="Ej. jperez" [readonly]="editando()" />
            @if (form.controls.username.touched && form.controls.username.invalid) {
              <span class="field-err">El username es obligatorio</span>
            }
          </div>
          <div class="field">
            <label class="label">Email</label>
            <input class="input" type="email" formControlName="email" placeholder="correo@empresa.com" />
          </div>
          @if (!editando()) {
            <div class="field full">
              <label class="label">Contraseña <span class="opt">mínimo 6 caracteres</span></label>
              <input class="input" type="password" formControlName="password" placeholder="••••••••" />
              @if (form.controls.password.touched && form.controls.password.invalid) {
                <span class="field-err">La contraseña debe tener al menos 6 caracteres</span>
              }
            </div>
          }
        </div>
      </form>
      <div foot>
        <button class="btn btn-ghost" (click)="closeForm()">Cancelar</button>
        <button class="btn btn-primary" (click)="save()">{{ editando() ? 'Guardar cambios' : 'Crear usuario' }}</button>
      </div>
    </app-modal>

    <!-- Cambiar contraseña -->
    <app-modal [open]="pwOpen()" (closed)="closePw()" size="sm">
      <span head>@if (pwUser(); as u) { Nueva contraseña · {{ u.nombre }} }</span>
      <form [formGroup]="pwForm" (ngSubmit)="savePw()" novalidate>
        <div class="field">
          <label class="label">Contraseña <span class="opt">mínimo 6 caracteres</span></label>
          <input class="input" type="password" formControlName="password" placeholder="••••••••" />
          @if (pwForm.controls.password.touched && pwForm.controls.password.invalid) {
            <span class="field-err">La contraseña debe tener al menos 6 caracteres</span>
          }
        </div>
      </form>
      <div foot>
        <button class="btn btn-ghost" (click)="closePw()">Cancelar</button>
        <button class="btn btn-primary" (click)="savePw()">Guardar contraseña</button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .usr-name {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .usr-name b {
        font-size: 13.5px;
      }
      .code {
        font-weight: 600;
        color: var(--text-soft);
        font-size: 12.5px;
      }
      .avatar.is-self {
        background: var(--brand);
        color: #fff;
      }
      .icon-action:hover {
        color: var(--brand);
        border-color: var(--brand);
        background: var(--brand-softer);
      }
      .icon-action {
        position: relative;
        border: 1px solid var(--border);
        background: #fff;
        border-radius: 7px;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-soft);
      }
      .icon-action .pwr {
        position: absolute;
        font-size: 8px;
        font-weight: 800;
        margin-top: 14px;
      }
    `,
  ],
})
export class UsuariosComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy = inject(DestroyRef);
  readonly auth = inject(AuthService);

  readonly usuarios = signal<UsuarioResponse[]>([]);
  readonly loading = signal(true);
  readonly formOpen = signal(false);
  readonly editando = signal(false);
  readonly pwOpen = signal(false);
  readonly pwUser = signal<UsuarioResponse | null>(null);
  private editingId: number | null = null;

  readonly roles = ROLES;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    rol: ['VENDEDOR' as Rol],
    username: ['', Validators.required],
    email: [''],
    password: ['', [Validators.minLength(6)]],
  });

  readonly pwForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get me() {
    return this.auth.user();
  }

  ngOnInit() {
    this.reload();
  }

  openForm(u?: UsuarioResponse) {
    this.editingId = u?.id ?? null;
    this.editando.set(!!u);
    this.form.reset({
      nombre: u?.nombre ?? '',
      rol: u?.rol ?? 'VENDEDOR',
      username: u?.username ?? '',
      email: u?.email ?? '',
      password: '',
    });
    if (u) this.form.controls.username.disable();
    else this.form.controls.username.enable();
    this.formOpen.set(true);
  }

  closeForm() {
    this.formOpen.set(false);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body = {
      username: v.username,
      nombre: v.nombre,
      email: v.email || undefined,
      rol: v.rol,
      password: v.password || undefined,
    };
    const call = this.editingId ? this.api.actualizarUsuario(this.editingId, body) : this.api.crearUsuario(body);
    call.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Usuario actualizado' : 'Usuario creado');
        this.closeForm();
        this.reload();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  toggleActivo(u: UsuarioResponse) {
    this.confirm
      .confirm({
        title: u.activo ? 'Desactivar usuario' : 'Activar usuario',
        message: u.activo
          ? `El usuario "${u.username}" no podrá iniciar sesión. ¿Continuar?`
          : `El usuario "${u.username}" volverá a poder iniciar sesión. ¿Continuar?`,
        confirmText: u.activo ? 'Desactivar' : 'Activar',
        danger: u.activo,
      })
      .then((ok) => {
        if (!ok) return;
        this.api.cambiarActivoUsuario(u.id).pipe(takeUntilDestroyed(this.destroy)).subscribe({
          next: () => {
            this.toast.success(u.activo ? 'Usuario desactivado' : 'Usuario activado');
            this.reload();
          },
          error: (e) => this.toast.error(errorMessage(e)),
        });
      });
  }

  openPassword(u: UsuarioResponse) {
    this.pwUser.set(u);
    this.pwForm.reset({ password: '' });
    this.pwOpen.set(true);
  }

  closePw() {
    this.pwOpen.set(false);
  }

  savePw() {
    const u = this.pwUser();
    if (!u || this.pwForm.invalid) return;
    this.api
      .cambiarPassword(u.id, this.pwForm.controls.password.value)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.toast.success('Contraseña actualizada');
          this.closePw();
        },
        error: (e) => this.toast.error(errorMessage(e)),
      });
  }

  private reload() {
    this.api
      .usuarios()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((us) => {
        this.usuarios.set(us);
        this.loading.set(false);
      });
  }

  protected readonly rolLabel = rolLabel;
  protected readonly date = date;
}
