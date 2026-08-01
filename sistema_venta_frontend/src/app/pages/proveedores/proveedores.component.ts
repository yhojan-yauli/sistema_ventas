import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProveedorResponse } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent, ModalFooterDirective } from '../../shared/modal.component';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, ModalComponent, ModalFooterDirective],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Proveedores</h1>
          <p class="page-sub">Tus aliados de compra y reposición</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" (click)="openForm()"><app-icon name="plus" [size]="16" /> Nuevo proveedor</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-block"><app-icon name="refresh" [size]="26" /></div>
      } @else {
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>RUC</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th class="right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (p of proveedores(); track p.id) {
                <tr>
                  <td>
                    <div class="prov-name">
                      <span class="avatar soft">{{ p.razonSocial.charAt(0) }}</span>
                      <b>{{ p.razonSocial }}</b>
                    </div>
                  </td>
                  <td class="code">{{ p.ruc ?? '—' }}</td>
                  <td>{{ p.telefono ?? '—' }}</td>
                  <td>{{ p.email ?? '—' }}</td>
                  <td>{{ p.direccion ?? '—' }}</td>
                  <td>
                    <div class="actions">
                      <button class="icon-action" (click)="openForm(p)" title="Editar"><app-icon name="pencil" [size]="15" /></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">
                    <div class="empty-state"><app-icon name="truck" [size]="34" /><p>No hay proveedores registrados</p></div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <app-modal [open]="formOpen()" (closed)="closeForm()">
      <span head>{{ editando() ? 'Editar proveedor' : 'Nuevo proveedor' }}</span>
      <form [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="form-grid">
          <div class="field">
            <label class="label">Nombre <span class="opt">obligatorio</span></label>
            <input class="input" formControlName="nombre" placeholder="Ej. Distribuidora Los Andes" />
            @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
              <span class="field-err">El nombre es obligatorio</span>
            }
          </div>
          <div class="field">
            <label class="label">RUC</label>
            <input class="input" formControlName="ruc" placeholder="20XXXXXXXXX" />
          </div>
          <div class="field">
            <label class="label">Teléfono</label>
            <input class="input" formControlName="telefono" placeholder="Ej. 999 888 777" />
          </div>
          <div class="field">
            <label class="label">Email</label>
            <input class="input" type="email" formControlName="email" placeholder="correo@empresa.com" />
          </div>
          <div class="field full">
            <label class="label">Dirección</label>
            <input class="input" formControlName="direccion" placeholder="Av., Jr., Mz…" />
          </div>
        </div>
      </form>
      <div foot>
        <button class="btn btn-ghost" (click)="closeForm()">Cancelar</button>
        <button class="btn btn-primary" (click)="save()">Guardar</button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .prov-name {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .prov-name b {
        font-size: 13.5px;
      }
      .code {
        font-weight: 600;
        color: var(--text-soft);
        font-size: 12.5px;
      }
      .icon-action.danger:hover {
        color: var(--danger);
        border-color: var(--danger);
        background: var(--danger-soft);
      }
    `,
  ],
})
export class ProveedoresComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy = inject(DestroyRef);

  readonly proveedores = signal<ProveedorResponse[]>([]);
  readonly loading = signal(true);
  readonly formOpen = signal(false);
  readonly editando = signal(false);
  private editingId: number | null = null;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    ruc: [''],
    telefono: [''],
    email: [''],
    direccion: [''],
  });

  ngOnInit() {
    this.api
      .proveedores()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((ps) => {
        this.proveedores.set(ps);
        this.loading.set(false);
      });
  }

  openForm(p?: ProveedorResponse) {
    this.editingId = p?.id ?? null;
    this.editando.set(!!p);
    this.form.reset({
      nombre: p?.razonSocial ?? '',
      ruc: p?.ruc ?? '',
      telefono: p?.telefono ?? '',
      email: p?.email ?? '',
      direccion: p?.direccion ?? '',
    });
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
      razonSocial: v.nombre,
      ruc: v.ruc || undefined,
      telefono: v.telefono || undefined,
      email: v.email || undefined,
      direccion: v.direccion || undefined,
    };
    const call = this.editingId ? this.api.actualizarProveedor(this.editingId, body) : this.api.crearProveedor(body);
    call.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Proveedor actualizado' : 'Proveedor creado');
        this.closeForm();
        this.reload();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  private reload() {
    this.api.proveedores().pipe(takeUntilDestroyed(this.destroy)).subscribe((ps) => this.proveedores.set(ps));
  }
}
