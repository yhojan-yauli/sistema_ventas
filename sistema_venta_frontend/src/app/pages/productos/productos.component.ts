import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriaResponse, MovimientoStockResponse, ProductoResponse } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { date, errorMessage, money } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent, ModalFooterDirective } from '../../shared/modal.component';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, ModalComponent, ModalFooterDirective],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Productos</h1>
          <p class="page-sub">Catálogo, precios y stock de tu tienda</p>
        </div>
        <div class="page-actions">
          <div class="search-box">
            <app-icon name="search" [size]="16" />
            <input class="input" type="text" [value]="q()" (input)="q.set($any($event.target).value)" placeholder="Buscar producto…" />
          </div>
          @if (auth.isAdmin) {
            <button class="btn btn-primary" (click)="openForm()"><app-icon name="plus" [size]="16" /> Nuevo producto</button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading-block"><app-icon name="refresh" [size]="26" /></div>
      } @else {
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th class="right">Precio compra</th>
                <th class="right">Precio venta</th>
                <th class="right">Stock</th>
                <th>Estado</th>
                <th class="right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filtered(); track p.id) {
                <tr>
                  <td><span class="code">{{ p.codigo ?? '—' }}</span></td>
                  <td>
                    <div class="prod-name">
                      <span class="avatar soft">{{ p.nombre.charAt(0) }}</span>
                      <div>
                        <b>
                          {{ p.nombre }}
                          @if (p.ventaPorPeso) {
                            <span class="badge badge-neutral">{{ p.pesoGramos }} g</span>
                          }
                        </b>
                        @if (p.descripcion) {
                          <small>{{ p.descripcion }}</small>
                        }
                      </div>
                    </div>
                  </td>
                  <td>{{ p.categoriaNombre ?? '—' }}</td>
                  <td class="num">{{ money(p.precioCompra) }}</td>
                  <td class="num">{{ money(p.precioVenta) }}</td>
                  <td class="num">
                    <span class="badge" [class.badge-success]="p.stock > p.stockMinimo" [class.badge-warning]="p.stock <= p.stockMinimo && p.stock > 0" [class.badge-danger]="p.stock === 0">
                      {{ p.stock }} uds.
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class.badge-success]="p.activo" [class.badge-neutral]="!p.activo">
                      {{ p.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <div class="actions">
                      @if (auth.isAdmin) {
                        <button class="icon-action" (click)="openForm(p)" title="Editar"><app-icon name="pencil" [size]="15" /></button>
                        <button class="icon-action" (click)="openAjuste(p)" title="Ajustar stock"><app-icon name="package" [size]="15" /></button>
                        <button class="icon-action" (click)="toggleActivo(p)" [title]="p.activo ? 'Desactivar' : 'Activar'">
                          <app-icon name="power" [size]="15" />
                          <span class="pwr">{{ p.activo ? 'off' : 'on' }}</span>
                        </button>
                      }
                      <button class="icon-action" (click)="openMovimientos(p)" title="Movimientos"><app-icon name="history" [size]="15" /></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8">
                    <div class="empty-state"><app-icon name="box" [size]="34" /><p>No hay productos que coincidan</p></div>
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
      <span head>{{ editando() ? 'Editar producto' : 'Nuevo producto' }}</span>
      <form [formGroup]="form" (ngSubmit)="saveForm()" novalidate>
        <div class="form-grid">
          <div class="field">
            <label class="label">Código</label>
            <input class="input" formControlName="codigo" placeholder="P10" />
          </div>
          <div class="field">
            <label class="label">Categoría</label>
            <select class="select" formControlName="categoriaId">
              <option [ngValue]="null">Sin categoría</option>
              @for (c of categorias(); track c.id) {
                <option [ngValue]="c.id">{{ c.nombre }}</option>
              }
            </select>
          </div>
          <div class="field full">
            <label class="label">Nombre <span class="opt">obligatorio</span></label>
            <input class="input" formControlName="nombre" placeholder="Ej. Gaseosa 1L" />
            @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
              <span class="field-err">El nombre es obligatorio</span>
            }
          </div>
          <div class="field full">
            <label class="label">Descripción</label>
            <textarea class="textarea" formControlName="descripcion" rows="2" placeholder="Detalle breve del producto"></textarea>
          </div>
          <div class="field">
            <label class="label">{{ form.controls.ventaPorPeso.value ? 'Precio de compra (por kg, S/)' : 'Precio de compra (S/)' }}</label>
            <input class="input" type="number" step="0.01" min="0" formControlName="precioCompra" />
          </div>
          <div class="field">
            <label class="label">{{ form.controls.ventaPorPeso.value ? 'Precio de venta (por kg, S/)' : 'Precio de venta (S/)' }}</label>
            <input class="input" type="number" step="0.01" min="0" formControlName="precioVenta" />
          </div>
          @if (form.controls.ventaPorPeso.value) {
            <div class="field">
              <label class="label">Peso de cada porción (gramos)</label>
              <input class="input" type="number" min="1" formControlName="pesoGramos" placeholder="Ej. 499" />
              <span class="field-hint">Se calcula el precio/costo por porción automáticamente</span>
            </div>
          }
          <div class="field">
            <label class="label">Stock inicial</label>
            <input class="input" type="number" min="0" formControlName="stock" />
          </div>
          <div class="field">
            <label class="label">Stock mínimo</label>
            <input class="input" type="number" min="0" formControlName="stockMinimo" />
          </div>
          <div class="switch-row full">
            <label class="switch">
              <input type="checkbox" formControlName="ventaPorPeso" />
              <span class="track"></span>
            </label>
            <div>
              <b>Venta por peso (kilos)</b>
              <small>Ej. filetes: compras la carne por kilo y vendes por porción</small>
            </div>
          </div>
          <div class="switch-row full">
            <label class="switch">
              <input type="checkbox" formControlName="incluyeIGV" />
              <span class="track"></span>
            </label>
            <div>
              <b>El precio incluye IGV</b>
              <small>Se calcula el IGV interno al facturar</small>
            </div>
          </div>
        </div>
      </form>
      <div foot>
        <button class="btn btn-ghost" (click)="closeForm()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="saving()" (click)="saveForm()">
          @if (saving()) { <span class="spinner"></span> Guardando… } @else { Guardar producto }
        </button>
      </div>
    </app-modal>

    <!-- Ajuste de stock -->
    <app-modal [open]="ajusteOpen()" (closed)="closeAjuste()" size="sm">
      <span head>@if (ajusteProd(); as p) { Ajustar stock · {{ p.nombre }} }</span>
      <form [formGroup]="ajusteForm" (ngSubmit)="saveAjuste()" novalidate>
        @if (ajusteProd(); as p) {
          <p class="muted mb-12">Stock actual: <b class="money">{{ p.stock }} uds.</b></p>
        }
        <div class="field mb-12">
          <label class="label">Cantidad <span class="opt">positiva = entrada, negativa = salida</span></label>
          <input class="input" type="number" formControlName="cantidad" placeholder="Ej. 10 o -2" />
        </div>
        <div class="field">
          <label class="label">Motivo</label>
          <input class="input" formControlName="motivo" placeholder="Ej. Compra, merma, devolución…" />
        </div>
      </form>
      <div foot>
        <button class="btn btn-ghost" (click)="closeAjuste()">Cancelar</button>
        <button class="btn btn-primary" (click)="saveAjuste()">Aplicar</button>
      </div>
    </app-modal>

    <!-- Movimientos -->
    <app-modal [open]="movOpen()" (closed)="closeMovimientos()" size="lg">
      <span head>@if (movProd(); as p) { Movimientos · {{ p.nombre }} }</span>
      <div class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th class="right">Cantidad</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            @for (m of movimientos(); track m.id) {
              <tr>
                <td>{{ date(m.fecha) }}</td>
                <td>
                  <span class="badge" [class.badge-success]="m.tipo === 'ENTRADA'" [class.badge-danger]="m.tipo === 'SALIDA'">
                    {{ m.tipo === 'ENTRADA' ? 'Entrada' : 'Salida' }}
                  </span>
                </td>
                <td class="num">{{ m.cantidad }} uds.</td>
                <td>{{ m.motivo ?? '—' }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4"><div class="empty-state"><app-icon name="history" [size]="30" /><p>Sin movimientos registrados</p></div></td>
              </tr>
            }
          </tbody>
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
      .prod-name {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .prod-name > div {
        display: flex;
        flex-direction: column;
        line-height: 1.35;
      }
      .prod-name b {
        font-size: 13.5px;
      }
      .prod-name small {
        color: var(--text-faint);
        font-size: 12px;
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
        transition: all 0.12s ease;
      }
      .icon-action:hover {
        color: var(--brand);
        border-color: var(--brand);
        background: var(--brand-softer);
      }
      .icon-action .pwr {
        position: absolute;
        font-size: 8px;
        font-weight: 800;
        margin-top: 14px;
      }
      .switch-row {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 12px 14px;
      }
      .switch-row > div {
        display: flex;
        flex-direction: column;
        line-height: 1.35;
      }
      .switch-row b {
        font-size: 13.5px;
      }
      .switch-row small {
        color: var(--text-faint);
        font-size: 12px;
      }
      .field-hint {
        font-size: 11.5px;
        color: var(--text-faint);
        margin-top: 4px;
      }
    `,
  ],
})
export class ProductosComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy = inject(DestroyRef);

  readonly productos = signal<ProductoResponse[]>([]);
  readonly categorias = signal<CategoriaResponse[]>([]);
  readonly loading = signal(true);
  readonly q = signal('');

  readonly formOpen = signal(false);
  readonly editando = signal(false);
  readonly saving = signal(false);
  private editingId: number | null = null;

  readonly ajusteOpen = signal(false);
  readonly ajusteProd = signal<ProductoResponse | null>(null);

  readonly movOpen = signal(false);
  readonly movProd = signal<ProductoResponse | null>(null);
  readonly movimientos = signal<MovimientoStockResponse[]>([]);

  readonly form = this.fb.nonNullable.group({
    codigo: [''],
    nombre: ['', Validators.required],
    categoriaId: [null as number | null],
    descripcion: [''],
    precioCompra: [0, [Validators.required, Validators.min(0)]],
    precioVenta: [0, [Validators.required, Validators.min(0)]],
    stock: [0],
    stockMinimo: [0],
    ventaPorPeso: [false],
    pesoGramos: [null as number | null],
    incluyeIGV: [true],
  });

  readonly ajusteForm = this.fb.nonNullable.group({
    cantidad: [0, Validators.required],
    motivo: [''],
  });

  readonly filtered = computed(() => {
    const term = this.q().trim().toLowerCase();
    if (!term) return this.productos();
    return this.productos().filter(
      (p) => p.nombre.toLowerCase().includes(term) || (p.codigo ?? '').toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.api
      .productos(this.auth.isAdmin ? false : true)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (ps) => {
          this.productos.set(ps);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    this.api.categorias().pipe(takeUntilDestroyed(this.destroy)).subscribe((cs) => this.categorias.set(cs));
  }

  openForm(p?: ProductoResponse) {
    this.editingId = p?.id ?? null;
    this.editando.set(!!p);
    this.form.reset({
      codigo: p?.codigo ?? '',
      nombre: p?.nombre ?? '',
      categoriaId: p?.categoriaId ?? null,
      descripcion: p?.descripcion ?? '',
      precioCompra: p?.precioCompra ?? 0,
      precioVenta: p?.precioVenta ?? 0,
      stock: p?.stock ?? 0,
      stockMinimo: p?.stockMinimo ?? 0,
      ventaPorPeso: p?.ventaPorPeso ?? false,
      pesoGramos: p?.pesoGramos ?? null,
      incluyeIGV: p?.incluyeIGV ?? true,
    });
    this.formOpen.set(true);
  }

  closeForm() {
    this.formOpen.set(false);
  }

  saveForm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.ventaPorPeso && !v.pesoGramos) {
      this.toast.warning('Indica el peso de cada porción en gramos');
      return;
    }
    const body = {
      codigo: v.codigo || undefined,
      nombre: v.nombre,
      categoriaId: v.categoriaId,
      descripcion: v.descripcion || undefined,
      precioCompra: v.precioCompra,
      precioVenta: v.precioVenta,
      incluyeIGV: v.incluyeIGV,
      stock: v.stock,
      stockMinimo: v.stockMinimo,
      ventaPorPeso: v.ventaPorPeso,
      pesoGramos: v.ventaPorPeso ? v.pesoGramos : null,
      activo: true,
    };
    this.saving.set(true);
    const call = this.editingId ? this.api.actualizarProducto(this.editingId, body) : this.api.crearProducto(body);
    call.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.toast.success(this.editingId ? 'Producto actualizado' : 'Producto creado');
        this.reload();
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.error(errorMessage(e));
      },
    });
  }

  toggleActivo(p: ProductoResponse) {
    this.confirm
      .confirm({
        title: p.activo ? 'Desactivar producto' : 'Activar producto',
        message: p.activo
          ? `El producto "${p.nombre}" dejará de estar disponible en el punto de venta. ¿Continuar?`
          : `El producto "${p.nombre}" volverá a estar disponible en el punto de venta. ¿Continuar?`,
        confirmText: p.activo ? 'Desactivar' : 'Activar',
        danger: p.activo,
      })
      .then((ok) => {
        if (!ok) return;
        this.api.cambiarActivoProducto(p.id).pipe(takeUntilDestroyed(this.destroy)).subscribe({
          next: () => {
            this.toast.success(p.activo ? 'Producto desactivado' : 'Producto activado');
            this.reload();
          },
          error: (e) => this.toast.error(errorMessage(e)),
        });
      });
  }

  openAjuste(p: ProductoResponse) {
    this.ajusteProd.set(p);
    this.ajusteForm.reset({ cantidad: 0, motivo: '' });
    this.ajusteOpen.set(true);
  }

  closeAjuste() {
    this.ajusteOpen.set(false);
  }

  saveAjuste() {
    const p = this.ajusteProd();
    if (!p || this.ajusteForm.invalid) return;
    this.api
      .ajustarStock(p.id, this.ajusteForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.toast.success('Stock ajustado correctamente');
          this.closeAjuste();
          this.reload();
        },
        error: (e) => this.toast.error(errorMessage(e)),
      });
  }

  openMovimientos(p: ProductoResponse) {
    this.movProd.set(p);
    this.movimientos.set([]);
    this.movOpen.set(true);
    this.api.movimientosProducto(p.id).pipe(takeUntilDestroyed(this.destroy)).subscribe((ms) => this.movimientos.set(ms));
  }

  closeMovimientos() {
    this.movOpen.set(false);
  }

  private reload() {
    this.api
      .productos(this.auth.isAdmin ? false : true)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((ps) => this.productos.set(ps));
  }

  protected readonly money = money;
  protected readonly date = date;
}
