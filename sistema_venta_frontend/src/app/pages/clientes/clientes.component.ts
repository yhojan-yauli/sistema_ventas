import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteResponse, TipoDocumento } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { TIPOS_DOCUMENTO, errorMessage } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent, ModalFooterDirective } from '../../shared/modal.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, ModalComponent, ModalFooterDirective],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Clientes</h1>
          <p class="page-sub">Directorio de clientes para boletas y facturas</p>
        </div>
        <div class="page-actions">
          <div class="search-box">
            <app-icon name="search" [size]="16" />
            <input class="input" type="text" [value]="q()" (input)="onSearch($any($event.target).value)" placeholder="Buscar por nombre o documento…" />
          </div>
          <button class="btn btn-primary" (click)="openForm()"><app-icon name="plus" [size]="16" /> Nuevo cliente</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-block"><app-icon name="refresh" [size]="26" /></div>
      } @else {
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th class="right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (c of clientes(); track c.id) {
                <tr>
                  <td>
                    <div class="cli-name">
                      <span class="avatar soft">{{ c.razonSocial.charAt(0) }}</span>
                      <b>{{ c.razonSocial }}</b>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-neutral">{{ docLabel(c.tipoDocumento) }}</span>
                    <span class="doc-num">{{ c.numeroDocumento }}</span>
                  </td>
                  <td>{{ c.telefono ?? '—' }}</td>
                  <td>{{ c.email ?? '—' }}</td>
                  <td>{{ c.direccion ?? '—' }}</td>
                  <td>
                    <div class="actions">
                      <button class="icon-action" (click)="openForm(c)" title="Editar"><app-icon name="pencil" [size]="15" /></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">
                    <div class="empty-state"><app-icon name="users" [size]="34" /><p>No hay clientes que coincidan</p></div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <app-modal [open]="formOpen()" (closed)="closeForm()">
      <span head>{{ editando() ? 'Editar cliente' : 'Nuevo cliente' }}</span>
      <form [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="form-grid">
          <div class="field">
            <label class="label">Tipo de documento</label>
            <select class="select" formControlName="tipoDocumento">
              @for (t of tiposDocumento; track t.value) {
                <option [value]="t.value">{{ t.label }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label class="label">Número <span class="opt">obligatorio</span></label>
            <div class="doc-row">
              <input class="input" formControlName="numeroDocumento" placeholder="Ej. 70123456" (blur)="onNumeroBlur()" />
              <button type="button" class="btn btn-soft" (click)="consultar()" [disabled]="buscando()">
                <app-icon name="search" [size]="15" />
                {{ buscando() ? 'Consultando…' : 'Buscar' }}
              </button>
            </div>
            @if (consultaOrigen(); as origen) {
              <span class="consulta-hint"><app-icon name="check" [size]="13" /> {{ origen }}</span>
            }
            @if (form.controls.numeroDocumento.touched && form.controls.numeroDocumento.invalid) {
              <span class="field-err">El número es obligatorio</span>
            }
          </div>
          <div class="field full">
            <label class="label">Razón social / Nombre <span class="opt">obligatorio</span></label>
            <input class="input" formControlName="razonSocial" placeholder="Ej. María García" />
            @if (form.controls.razonSocial.touched && form.controls.razonSocial.invalid) {
              <span class="field-err">El nombre es obligatorio</span>
            }
          </div>
          <div class="field">
            <label class="label">Teléfono</label>
            <input class="input" formControlName="telefono" placeholder="Ej. 999 888 777" />
          </div>
          <div class="field">
            <label class="label">Email</label>
            <input class="input" type="email" formControlName="email" placeholder="cliente@correo.com" />
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
      .cli-name {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .cli-name b {
        font-size: 13.5px;
      }
      .doc-num {
        font-weight: 600;
        color: var(--text-soft);
        font-size: 12.5px;
        margin-left: 8px;
      }
      .icon-action:hover {
        color: var(--brand);
        border-color: var(--brand);
        background: var(--brand-softer);
      }
      .doc-row {
        display: flex;
        gap: 8px;
      }
      .doc-row .input {
        flex: 1;
      }
      .doc-row .btn {
        white-space: nowrap;
      }
      .consulta-hint {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-top: 6px;
        font-size: 12px;
        color: var(--success, #16a34a);
      }
    `,
  ],
})
export class ClientesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy = inject(DestroyRef);

  readonly clientes = signal<ClienteResponse[]>([]);
  readonly loading = signal(true);
  readonly q = signal('');
  readonly formOpen = signal(false);
  readonly editando = signal(false);
  readonly buscando = signal(false);
  readonly consultaOrigen = signal<string | null>(null);
  private editingId: number | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly tiposDocumento = TIPOS_DOCUMENTO;

  readonly form = this.fb.nonNullable.group({
    tipoDocumento: ['DNI' as TipoDocumento],
    numeroDocumento: ['', Validators.required],
    razonSocial: ['', Validators.required],
    telefono: [''],
    email: [''],
    direccion: [''],
  });

  ngOnInit() {
    this.reload();
  }

  onSearch(value: string) {
    this.q.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.reload(), 350);
  }

  openForm(c?: ClienteResponse) {
    this.editingId = c?.id ?? null;
    this.editando.set(!!c);
    this.form.reset({
      tipoDocumento: c?.tipoDocumento ?? 'DNI',
      numeroDocumento: c?.numeroDocumento ?? '',
      razonSocial: c?.razonSocial ?? '',
      telefono: c?.telefono ?? '',
      email: c?.email ?? '',
      direccion: c?.direccion ?? '',
    });
    this.consultaOrigen.set(null);
    this.formOpen.set(true);
  }

  consultar() {
    const tipo = this.form.controls.tipoDocumento.value as TipoDocumento;
    const numero = (this.form.controls.numeroDocumento.value || '').replace(/\D/g, '');
    if (tipo !== 'DNI' && tipo !== 'RUC') {
      this.toast.warning('Solo se puede consultar un DNI o RUC');
      return;
    }
    const esperado = tipo === 'DNI' ? 8 : 11;
    if (numero.length !== esperado) {
      this.toast.warning(tipo === 'DNI' ? 'El DNI debe tener 8 dígitos' : 'El RUC debe tener 11 dígitos');
      return;
    }
    this.buscando.set(true);
    this.api
      .consultarCliente(tipo, numero)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (r) => {
          this.buscando.set(false);
          this.form.patchValue({
            razonSocial: r.razonSocial,
            telefono: r.telefono ?? '',
            direccion: r.direccion ?? '',
            email: r.email ?? '',
          });
          this.consultaOrigen.set(r.local ? 'Encontrado en tu base de datos' : 'Datos obtenidos en línea');
          this.toast.success(r.local ? 'Cliente encontrado en tu base de datos' : 'Datos del documento cargados');
        },
        error: (e) => {
          this.buscando.set(false);
          this.toast.error(errorMessage(e));
        },
      });
  }

  onNumeroBlur() {
    if (this.editingId) return;
    const tipo = this.form.controls.tipoDocumento.value as TipoDocumento;
    const numero = (this.form.controls.numeroDocumento.value || '').replace(/\D/g, '');
    const esperado = tipo === 'DNI' ? 8 : tipo === 'RUC' ? 11 : 0;
    if (numero.length === esperado) {
      this.consultar();
    }
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
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: v.numeroDocumento,
      razonSocial: v.razonSocial,
      telefono: v.telefono || undefined,
      email: v.email || undefined,
      direccion: v.direccion || undefined,
    };
    const call = this.editingId ? this.api.actualizarCliente(this.editingId, body) : this.api.crearCliente(body);
    call.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Cliente actualizado' : 'Cliente creado');
        this.closeForm();
        this.reload();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  private reload() {
    this.api
      .clientes(this.q())
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((cs) => {
        this.clientes.set(cs);
        this.loading.set(false);
      });
  }

  docLabel(tipo: TipoDocumento) {
    return TIPOS_DOCUMENTO.find((t) => t.value === tipo)?.label ?? tipo;
  }
}
