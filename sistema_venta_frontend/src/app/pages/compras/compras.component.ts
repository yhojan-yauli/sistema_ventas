import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompraResponse, ProductoResponse, ProveedorResponse } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { date, errorMessage, money } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent, ModalFooterDirective } from '../../shared/modal.component';

interface LineaCompra {
  productoId: number | null;
  cantidad: number;
  precioUnitario: number;
}

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, ModalComponent, ModalFooterDirective],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Compras</h1>
          <p class="page-sub">Ingresos de mercadería a proveedores</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" (click)="openForm()"><app-icon name="plus" [size]="16" /> Nueva compra</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-block"><app-icon name="refresh" [size]="26" /></div>
      } @else {
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Compra</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>N° documento</th>
                <th class="right">Ítems</th>
                <th class="right">Total</th>
                <th class="right">Ver</th>
              </tr>
            </thead>
            <tbody>
              @for (c of compras(); track c.id) {
                <tr>
                  <td><span class="code">#{{ c.id }}</span></td>
                  <td>{{ date(c.fecha) }}</td>
                  <td>{{ c.proveedorNombre }}</td>
                  <td class="code">{{ c.numeroDocumento ?? '—' }}</td>
                  <td class="num">{{ c.items.length }}</td>
                  <td class="num"><b>{{ money(c.total) }}</b></td>
                  <td>
                    <div class="actions">
                      <button class="icon-action" (click)="openDetail(c)" title="Ver detalle"><app-icon name="eye" [size]="15" /></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7">
                    <div class="empty-state"><app-icon name="bag" [size]="34" /><p>Aún no hay compras registradas</p></div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Nueva compra -->
    <app-modal [open]="formOpen()" (closed)="closeForm()" size="xl">
      <span head>Nueva compra</span>
      <form [formGroup]="form" novalidate>
        <div class="form-grid">
          <div class="field">
            <label class="label">Proveedor <span class="opt">obligatorio</span></label>
            <select class="select" formControlName="proveedorId">
              <option [ngValue]="null" disabled>Selecciona…</option>
              @for (p of proveedores(); track p.id) {
                <option [ngValue]="p.id">{{ p.razonSocial }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label class="label">N° documento</label>
            <input class="input" formControlName="numeroDocumento" placeholder="Ej. F001-00234" />
          </div>
          <div class="field">
            <label class="label">Fecha</label>
            <input class="input" type="date" formControlName="fecha" />
          </div>
        </div>

        <div class="compra-lines">
          <div class="compra-lines-head">
            <b>Productos</b>
            <button class="btn btn-ghost btn-sm" (click)="addLinea()"><app-icon name="plus" [size]="14" /> Agregar producto</button>
          </div>
          @for (linea of lineas(); track $index) {
            <div class="linea">
              <select class="select" [value]="linea.productoId ?? ''" (change)="onLineaProd($index, $any($event.target).value)">
                <option value="" disabled>Selecciona producto…</option>
                @for (p of productos(); track p.id) {
                  <option [value]="p.id">{{ p.codigo ? p.codigo + ' · ' : '' }}{{ p.nombre }}</option>
                }
              </select>
              <input class="input" type="number" min="1" [value]="linea.cantidad" (change)="onLineaCantidad($index, $any($event.target).value)" placeholder="Cant." />
              <input class="input" type="number" min="0" step="0.01" [value]="linea.precioUnitario" (change)="onLineaPrecio($index, $any($event.target).value)" placeholder="Precio S/" />
              <span class="linea-sub">{{ money((linea.productoId ? (linea.cantidad || 0) * (linea.precioUnitario || 0) : 0)) }}</span>
              <button class="icon-action danger" (click)="removeLinea($index)" title="Quitar"><app-icon name="x" [size]="15" /></button>
            </div>
          }
          @if (lineas().length === 0) {
            <div class="empty-state"><app-icon name="package" [size]="30" /><p>Agrega al menos un producto</p></div>
          }
        </div>
      </form>
      <div foot>
        <div class="total-inline">Total: <b>{{ money(totalCompra()) }}</b></div>
        <button class="btn btn-ghost" (click)="closeForm()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
          @if (saving()) { <span class="spinner"></span> Guardando… } @else { Registrar compra }
        </button>
      </div>
    </app-modal>

    <!-- Detalle -->
    <app-modal [open]="detailOpen()" (closed)="closeDetail()" size="lg">
      <span head>@if (detail(); as c) { Compra #{{ c.id }} · {{ c.proveedorNombre }} }</span>
      <div class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Producto</th>
              <th class="right">Cantidad</th>
              <th class="right">P. unitario</th>
              <th class="right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            @for (i of detail()?.items ?? []; track i.productoId) {
              <tr>
                <td>{{ i.productoNombre }}</td>
                <td class="num">{{ i.cantidad }}</td>
                <td class="num">{{ money(i.precioUnitario) }}</td>
                <td class="num">{{ money(i.subtotal) }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="right"><b>Total</b></td>
              <td class="num"><b class="text-brand">{{ money(detail()?.total ?? 0) }}</b></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .code {
        font-weight: 700;
        color: var(--brand);
        font-size: 12.5px;
      }
      .icon-action:hover {
        color: var(--brand);
        border-color: var(--brand);
        background: var(--brand-softer);
      }
      .icon-action.danger:hover {
        color: var(--danger);
        border-color: var(--danger);
        background: var(--danger-soft);
      }
      .compra-lines {
        margin-top: 16px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: var(--surface-soft);
      }
      .compra-lines-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      .compra-lines-head b {
        font-size: 13.5px;
      }
      .linea {
        display: grid;
        grid-template-columns: 1fr 90px 110px 100px 34px;
        gap: 8px;
        align-items: center;
      }
      @media (max-width: 720px) {
        .linea {
          grid-template-columns: 1fr;
        }
      }
      .linea-sub {
        text-align: right;
        font-weight: 700;
        font-size: 13px;
      }
      .total-inline {
        margin-right: auto;
        font-size: 14px;
      }
      .total-inline b {
        font-size: 16px;
        color: var(--brand-deep);
      }
      .text-brand {
        color: var(--brand-deep);
      }
    `,
  ],
})
export class ComprasComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy = inject(DestroyRef);

  readonly compras = signal<CompraResponse[]>([]);
  readonly proveedores = signal<ProveedorResponse[]>([]);
  readonly productos = signal<ProductoResponse[]>([]);
  readonly loading = signal(true);
  readonly formOpen = signal(false);
  readonly detailOpen = signal(false);
  readonly saving = signal(false);
  readonly detail = signal<CompraResponse | null>(null);
  readonly lineas = signal<LineaCompra[]>([]);

  readonly form = this.fb.nonNullable.group({
    proveedorId: [null as number | null, Validators.required],
    numeroDocumento: [''],
    fecha: [''],
  });

  readonly totalCompra = computed(() =>
    Math.round(this.lineas().reduce((acc, l) => acc + (l.cantidad || 0) * (l.precioUnitario || 0), 0) * 100) / 100
  );

  ngOnInit() {
    this.api
      .compras()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((cs) => {
        this.compras.set(cs);
        this.loading.set(false);
      });
    this.api.proveedores().pipe(takeUntilDestroyed(this.destroy)).subscribe((ps) => this.proveedores.set(ps));
    this.api.productos(true).pipe(takeUntilDestroyed(this.destroy)).subscribe((ps) => this.productos.set(ps));
  }

  openForm() {
    this.form.reset({ proveedorId: null, numeroDocumento: '', fecha: '' });
    this.lineas.set([{ productoId: null, cantidad: 1, precioUnitario: 0 }]);
    this.formOpen.set(true);
  }

  closeForm() {
    this.formOpen.set(false);
  }

  addLinea() {
    this.lineas.update((ls) => [...ls, { productoId: null, cantidad: 1, precioUnitario: 0 }]);
  }

  removeLinea(idx: number) {
    this.lineas.update((ls) => ls.filter((_, i) => i !== idx));
  }

  onLineaProd(idx: number, value: string) {
    this.lineas.update((ls) => ls.map((l, i) => (i === idx ? { ...l, productoId: value ? Number(value) : null } : l)));
  }

  onLineaCantidad(idx: number, value: string) {
    this.lineas.update((ls) => ls.map((l, i) => (i === idx ? { ...l, cantidad: Math.max(1, Number(value) || 1) } : l)));
  }

  onLineaPrecio(idx: number, value: string) {
    this.lineas.update((ls) => ls.map((l, i) => (i === idx ? { ...l, precioUnitario: Math.max(0, Number(value) || 0) } : l)));
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const items = this.lineas()
      .filter((l) => l.productoId)
      .map((l) => ({ productoId: l.productoId!, cantidad: l.cantidad, precioUnitario: l.precioUnitario }));
    if (items.length === 0) {
      this.toast.warning('Agrega al menos un producto a la compra');
      return;
    }
    const v = this.form.getRawValue();
    const body = {
      proveedorId: v.proveedorId!,
      numeroDocumento: v.numeroDocumento || undefined,
      fecha: v.fecha ? new Date(v.fecha + 'T12:00:00').toISOString() : undefined,
      items,
    };
    this.saving.set(true);
    this.api
      .crearCompra(body)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Compra registrada y stock actualizado');
          this.closeForm();
          this.api.compras().pipe(takeUntilDestroyed(this.destroy)).subscribe((cs) => this.compras.set(cs));
        },
        error: (e) => {
          this.saving.set(false);
          this.toast.error(errorMessage(e));
        },
      });
  }

  openDetail(c: CompraResponse) {
    this.detail.set(c);
    this.detailOpen.set(true);
  }

  closeDetail() {
    this.detailOpen.set(false);
  }

  protected readonly money = money;
  protected readonly date = date;
}
