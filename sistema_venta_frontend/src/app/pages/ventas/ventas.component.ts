import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClienteResponse, ConfiguracionResponse, ProductoResponse, SesionResponse, TipoComprobante, TipoPago, VentaResponse } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { CajaService } from '../../core/services/caja.service';
import { ToastService } from '../../core/services/toast.service';
import { VentaService } from '../../core/services/venta.service';
import { TIPOS_COMPROBANTE, TIPOS_DOCUMENTO, TIPOS_PAGO, errorMessage, money, tipoComprobanteLabel, tipoPagoLabel } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent, ModalFooterDirective } from '../../shared/modal.component';

interface CartItem {
  productoId: number;
  nombre: string;
  codigo: string | null;
  precio: number;
  incluyeIGV: boolean;
  stock: number;
  cantidad: number;
  ventaPorPeso: boolean;
  pesoGramos: number | null;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, ModalComponent, ModalFooterDirective],
  template: `
    <div class="page pos-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Punto de venta</h1>
          <p class="page-sub">
            @if (sesion(); as s) {
              Vendiendo en <b class="text-brand">{{ s.cajaNombre }}</b>
            } @else {
              Necesitas abrir tu caja para vender
            }
          </p>
        </div>
        @if (sesion()) {
          <div class="page-actions">
            <button class="btn btn-outline" (click)="reload()"><app-icon name="refresh" [size]="16" /> Actualizar</button>
          </div>
        }
      </div>

      @if (!sesion()) {
        <div class="no-sesion">
          <div class="avatar soft lg"><app-icon name="cash-register" [size]="30" /></div>
          <h3>Sin caja abierta</h3>
          <p class="muted">Abre una caja para empezar a registrar ventas.</p>
          <button class="btn btn-primary" routerLink="/caja"><app-icon name="login" [size]="16" /> Ir a abrir caja</button>
        </div>
      } @else {
        <div class="pos">
          <!-- Catálogo -->
          <section class="pos-catalog">
            <div class="pos-search">
              <app-icon name="search" [size]="16" />
              <input class="input" type="text" [value]="q()" (input)="q.set($any($event.target).value)" placeholder="Buscar producto por nombre o código…" autofocus />
            </div>
            <div class="prod-grid">
              @for (p of filtered(); track p.id) {
                <button class="prod-tile" [class.out]="p.stock === 0" (click)="addToCart(p)">
                  <span class="prod-tile-code">{{ p.codigo ?? '—' }}</span>
                  <b>{{ p.nombre }}</b>
                  @if (p.ventaPorPeso) {
                    <small class="prod-tile-peso">{{ p.pesoGramos }} g por porción</small>
                  }
                  <div class="prod-tile-foot">
                    <span class="money">{{ money(precioPorcion(p)) }}</span>
                    <span class="badge" [class.badge-danger]="p.stock === 0" [class.badge-warning]="p.stock > 0 && p.stock <= p.stockMinimo" [class.badge-success]="p.stock > p.stockMinimo">
                      {{ p.stock }} {{ p.ventaPorPeso ? 'porc.' : 'uds.' }}
                    </span>
                  </div>
                </button>
              } @empty {
                <div class="empty-state span-all"><app-icon name="box" [size]="34" /><p>No hay productos disponibles</p></div>
              }
            </div>
          </section>

          <!-- Carrito -->
          <aside class="pos-cart">
            @if (cart().length === 0) {
              <div class="cart-empty">
                <app-icon name="cart" [size]="40" />
                <p>Selecciona productos para comenzar</p>
              </div>
            } @else {
              <div class="cart-items">
                @for (item of cart(); track item.productoId) {
                  <div class="cart-item">
                    <div class="cart-item-info">
                      <b>{{ item.nombre }}</b>
                      <small>
                        @if (item.ventaPorPeso) {
                          {{ money(item.precio) }} / porción · {{ item.pesoGramos }} g · {{ item.stock }} disponibles
                        } @else {
                          {{ money(item.precio) }} c/u · {{ item.stock }} disponibles
                        }
                      </small>
                    </div>
                    <div class="cart-qty">
                      <button class="qty-btn" (click)="dec(item)">−</button>
                      <span>{{ item.cantidad }}</span>
                      <button class="qty-btn" (click)="inc(item)">+</button>
                    </div>
                    <div class="cart-line-total">{{ money(item.precio * item.cantidad) }}</div>
                    <button class="cart-remove" (click)="remove(item)"><app-icon name="x" [size]="14" /></button>
                  </div>
                }
              </div>
            }

            <div class="cart-foot">
              <div class="cart-config">
                <div class="config-row">
                  <label class="label">Comprobante</label>
                  <div class="segmented">
                    @for (c of comprobantes; track c.value) {
                      <button class="seg" [class.on]="comprobante() === c.value" (click)="setComprobante(c.value)">{{ c.label }}</button>
                    }
                  </div>
                </div>

                <div class="config-row">
                  <label class="label">Cliente</label>
                  <div class="client-sel">
                    <input class="input" type="text" [value]="clienteQ()" (input)="onClienteSearch($any($event.target).value)" placeholder="Buscar o escribir…" />
                    <button class="icon-action" (click)="openClienteNuevo()" title="Crear y usar"><app-icon name="plus" [size]="15" /></button>
                  </div>
                  @if (clienteResults().length) {
                    <div class="client-drop">
                      @for (c of clienteResults(); track c.id) {
                        <button class="client-opt" [class.on]="cliente()?.id === c.id" (click)="selectCliente(c)">
                          <b>{{ c.razonSocial }}</b>
                          <small>{{ c.tipoDocumento }} {{ c.numeroDocumento }}</small>
                        </button>
                      }
                    </div>
                  }
                  @if (cliente(); as c) {
                    <div class="client-picked">
                      <span>{{ c.razonSocial }} · {{ c.numeroDocumento }}</span>
                      <button (click)="clearCliente()"><app-icon name="x" [size]="13" /></button>
                    </div>
                  }
                </div>

                <div class="config-row">
                  <label class="label">Método de pago</label>
                  <div class="chips">
                    @for (t of TIPOS_PAGO; track t.value) {
                      <button class="chip" [class.on]="tipoPago() === t.value" (click)="setTipoPago(t.value)">{{ t.label }}</button>
                    }
                  </div>
                </div>

                <div class="config-row">
                  <label class="label">Descuento global (S/)</label>
                  <input class="input" type="number" step="0.01" min="0" [value]="descuento()" (change)="onDescuento($any($event.target).value)" placeholder="0.00" />
                </div>

                @if (tipoPago() === 'EFECTIVO') {
                  <div class="config-row">
                    <label class="label">Recibido (S/)</label>
                    <input class="input" type="number" step="0.01" min="0" [value]="recibido()" (change)="onRecibido($any($event.target).value)" placeholder="0.00" />
                    @if (vuelto() !== null && vuelto()! >= 0) {
                      <div class="vuelto">Vuelto: <b>{{ money(vuelto()!) }}</b></div>
                    }
                  </div>
                }
              </div>

              <div class="totals">
                <div class="total-row"><span>Subtotal</span><b>{{ money(subtotal()) }}</b></div>
                <div class="total-row"><span>Descuento</span><b class="neg">− {{ money(descuento()) }}</b></div>
                <div class="total-row"><span>IGV ({{ igvTasa }}%)</span><b>{{ money(igv()) }}</b></div>
                <div class="total-row grand"><span>Total</span><b>{{ money(total()) }}</b></div>
              </div>

              <button class="btn btn-primary btn-lg w-full" [disabled]="cart().length === 0 || saving()" (click)="cobrar()">
                @if (saving()) {
                  <span class="spinner"></span> Procesando…
                } @else {
                  <app-icon name="cash" [size]="18" /> Cobrar {{ money(total()) }}
                }
              </button>
            </div>
          </aside>
        </div>
      }
    </div>

    <!-- Nuevo cliente -->
    <app-modal [open]="clienteOpen()" (closed)="closeClienteNuevo()">
      <span head>Nuevo cliente</span>
      <form [formGroup]="clienteForm" (ngSubmit)="createCliente()" novalidate>
        <div class="form-grid">
          <div class="field">
            <label class="label">Tipo de documento</label>
            <select class="select" formControlName="tipoDocumento">
              @for (t of TIPOS_DOCUMENTO; track t.value) {
                <option [value]="t.value">{{ t.label }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label class="label">Número <span class="opt">obligatorio</span></label>
            <input class="input" formControlName="numeroDocumento" placeholder="Ej. 70123456" />
          </div>
          <div class="field full">
            <label class="label">Razón social / Nombre <span class="opt">obligatorio</span></label>
            <input class="input" formControlName="razonSocial" placeholder="Ej. María García" />
          </div>
        </div>
      </form>
      <div foot>
        <button class="btn btn-ghost" (click)="closeClienteNuevo()">Cancelar</button>
        <button class="btn btn-primary" (click)="createCliente()">Crear y usar</button>
      </div>
    </app-modal>

    <!-- Venta exitosa -->
    <app-modal [open]="successOpen()" (closed)="successOpen.set(false)" size="sm">
      <span head>Venta registrada</span>
      <div class="success-body">
        <div class="success-check"><app-icon name="check" [size]="26" /></div>
        @if (lastVenta(); as v) {
          <h3>{{ v.serie }}-{{ v.numero }}</h3>
          <p class="muted">{{ tipoComprobanteLabel(v.tipoComprobante) }} · {{ tipoPagoLabel(v.tipoPago) }}</p>
          <div class="success-total">{{ money(v.total) }}</div>
        }
      </div>
      <div foot>
        <button class="btn btn-ghost" (click)="successOpen.set(false)">Cerrar</button>
        <button class="btn btn-primary" (click)="newSale()"><app-icon name="plus" [size]="15" /> Nueva venta</button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .pos-page {
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 64px);
      }
      .text-brand {
        color: var(--brand);
      }
      .no-sesion {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 60px 16px;
        text-align: center;
      }
      .no-sesion h3 {
        font-size: 18px;
      }
      .pos {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 16px;
        align-items: start;
      }
      @media (max-width: 1080px) {
        .pos {
          grid-template-columns: 1fr;
        }
      }
      .pos-catalog {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
      }
      .pos-search {
        position: relative;
        display: flex;
        align-items: center;
      }
      .pos-search app-icon {
        position: absolute;
        left: 12px;
        color: var(--text-faint);
      }
      .pos-search .input {
        padding-left: 38px;
      }
      .prod-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
        align-content: start;
      }
      .prod-tile {
        border: 1px solid var(--border);
        background: #fff;
        border-radius: 12px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
        text-align: left;
        transition: border-color 0.13s ease, transform 0.13s ease, box-shadow 0.13s ease;
      }
      .prod-tile:hover:not(.out) {
        border-color: var(--brand);
        box-shadow: 0 4px 14px rgba(15, 118, 110, 0.12);
        transform: translateY(-1px);
      }
      .prod-tile.out {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .prod-tile-code {
        font-size: 10.5px;
        font-weight: 800;
        color: var(--brand);
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .prod-tile b {
        font-size: 13px;
        line-height: 1.3;
        min-height: 34px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .prod-tile-peso {
        font-size: 11px;
        color: var(--brand);
        font-weight: 700;
      }
      .prod-tile-foot {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
      }
      .prod-tile-foot .money {
        font-weight: 700;
        font-size: 13px;
      }
      .pos-cart {
        position: sticky;
        top: 80px;
        background: #fff;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - 96px);
        overflow: hidden;
      }
      .cart-empty {
        padding: 60px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        color: var(--text-faint);
        text-align: center;
        font-size: 13px;
      }
      .cart-items {
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .cart-item {
        display: grid;
        grid-template-columns: 1fr auto auto auto;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--border-soft);
        background: var(--surface-soft);
        border-radius: 10px;
        padding: 8px 10px;
      }
      .cart-item-info {
        min-width: 0;
        display: flex;
        flex-direction: column;
        line-height: 1.3;
      }
      .cart-item-info b {
        font-size: 12.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cart-item-info small {
        color: var(--text-faint);
        font-size: 11px;
      }
      .cart-qty {
        display: flex;
        align-items: center;
        gap: 4px;
        background: #fff;
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 2px;
      }
      .qty-btn {
        border: 0;
        background: transparent;
        width: 22px;
        height: 22px;
        border-radius: 6px;
        font-size: 15px;
        font-weight: 700;
        color: var(--text-soft);
      }
      .qty-btn:hover {
        background: var(--surface-soft);
        color: var(--brand);
      }
      .cart-qty span {
        min-width: 20px;
        text-align: center;
        font-weight: 700;
        font-size: 13px;
      }
      .cart-line-total {
        font-weight: 700;
        font-size: 13px;
        min-width: 64px;
        text-align: right;
      }
      .cart-remove {
        border: 0;
        background: transparent;
        color: var(--text-faint);
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
      }
      .cart-remove:hover {
        color: var(--danger);
        background: var(--danger-soft);
      }
      .cart-foot {
        border-top: 1px solid var(--border);
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
      }
      .cart-config {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .config-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .segmented {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 3px;
        gap: 3px;
      }
      .seg {
        border: 0;
        background: transparent;
        padding: 7px 4px;
        border-radius: 7px;
        font-size: 12.5px;
        font-weight: 700;
        color: var(--text-soft);
        cursor: pointer;
      }
      .seg.on {
        background: #fff;
        color: var(--text);
        box-shadow: var(--shadow-xs);
      }
      .client-sel {
        display: flex;
        gap: 6px;
      }
      .client-sel .input {
        flex: 1;
      }
      .client-drop {
        position: relative;
        background: #fff;
        border: 1px solid var(--border);
        border-radius: 10px;
        box-shadow: var(--shadow);
        overflow: hidden;
        max-height: 200px;
        overflow-y: auto;
      }
      .client-opt {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border: 0;
        background: #fff;
        padding: 9px 12px;
        text-align: left;
        border-bottom: 1px solid var(--border-soft);
      }
      .client-opt:hover,
      .client-opt.on {
        background: var(--brand-softer);
      }
      .client-opt b {
        font-size: 13px;
      }
      .client-opt small {
        color: var(--text-faint);
        font-size: 11.5px;
      }
      .client-picked {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        background: var(--brand-softer);
        border: 1px solid var(--brand-soft);
        color: var(--brand-deep);
        border-radius: 8px;
        padding: 7px 10px;
        font-size: 12.5px;
        font-weight: 600;
      }
      .client-picked button {
        border: 0;
        background: transparent;
        color: inherit;
        display: flex;
        padding: 2px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .chip {
        border: 1px solid var(--border);
        background: #fff;
        border-radius: 999px;
        padding: 5px 12px;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-soft);
        cursor: pointer;
        transition: all 0.12s ease;
      }
      .chip.on {
        border-color: var(--brand);
        background: var(--brand-softer);
        color: var(--brand-deep);
      }
      .vuelto {
        font-size: 13px;
        font-weight: 600;
        color: var(--brand-deep);
      }
      .totals {
        display: flex;
        flex-direction: column;
        gap: 5px;
        padding: 10px 0;
        border-top: 1px dashed var(--border);
      }
      .total-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
      }
      .total-row span {
        color: var(--text-soft);
      }
      .total-row b {
        color: var(--text);
      }
      .total-row .neg {
        color: var(--danger);
      }
      .total-row.grand {
        border-top: 1px solid var(--border);
        padding-top: 8px;
        margin-top: 4px;
      }
      .total-row.grand span {
        font-size: 14px;
        font-weight: 700;
        color: var(--text);
      }
      .total-row.grand b {
        font-size: 20px;
        color: var(--brand-deep);
      }
      .btn-lg {
        height: 46px;
        font-size: 14.5px;
      }
      .success-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px 0;
        text-align: center;
      }
      .success-check {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--success-soft);
        color: var(--success);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .success-total {
        font-size: 26px;
        font-weight: 800;
        color: var(--brand-deep);
      }
      .icon-action:hover {
        color: var(--brand);
        border-color: var(--brand);
        background: var(--brand-softer);
      }
    `,
  ],
})
export class VentasComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly cajaService = inject(CajaService);
  private readonly ventaService = inject(VentaService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy = inject(DestroyRef);

  readonly TIPOS_PAGO = TIPOS_PAGO;
  readonly comprobantes = TIPOS_COMPROBANTE;
  readonly TIPOS_DOCUMENTO = TIPOS_DOCUMENTO;

  readonly sesion = signal<SesionResponse | null>(null);
  readonly productos = signal<ProductoResponse[]>([]);
  readonly q = signal('');
  readonly cart = signal<CartItem[]>([]);
  readonly comprobante = signal<TipoComprobante>('BOLETA');
  readonly tipoPago = signal<TipoPago>('EFECTIVO');
  readonly descuento = signal(0);
  readonly recibido = signal(0);
  readonly saving = signal(false);
  readonly successOpen = signal(false);
  readonly lastVenta = signal<VentaResponse | null>(null);

  readonly clienteQ = signal('');
  readonly clienteResults = signal<ClienteResponse[]>([]);
  readonly cliente = signal<ClienteResponse | null>(null);
  readonly clienteOpen = signal(false);

  igvTasa = 18;
  private precioIncluyeIGV = true;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly clienteForm = this.fb.nonNullable.group({
    tipoDocumento: ['DNI'],
    numeroDocumento: ['', Validators.required],
    razonSocial: ['', Validators.required],
  });

  readonly filtered = computed(() => {
    const term = this.q().trim().toLowerCase();
    if (!term) return this.productos();
    return this.productos().filter(
      (p) => p.nombre.toLowerCase().includes(term) || (p.codigo ?? '').toLowerCase().includes(term)
    );
  });

  readonly subtotal = computed(() => {
    const tasa = this.precioIncluyeIGV ? this.igvTasa : 0;
    let total = 0;
    for (const it of this.cart()) {
      const linea = it.precio * it.cantidad;
      total += this.precioIncluyeIGV ? linea : linea * (1 + tasa / 100);
    }
    return total - this.descuento();
  });

  readonly igv = computed(() => {
    if (!this.precioIncluyeIGV) return 0;
    const base = this.subtotal() / (1 + this.igvTasa / 100);
    return this.subtotal() - base;
  });

  readonly total = computed(() => {
    if (this.precioIncluyeIGV) return this.subtotal();
    return this.subtotal() + this.subtotal() * (this.igvTasa / 100);
  });

  readonly vuelto = computed(() => {
    if (this.tipoPago() !== 'EFECTIVO') return null;
    const r = this.recibido();
    if (!r) return null;
    return r - this.total();
  });

  ngOnInit() {
    this.cajaService
      .miSesion()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((s) => this.sesion.set(s));
    this.api
      .configuracion()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((c: ConfiguracionResponse) => {
        this.igvTasa = c.igvPorcentaje;
        this.precioIncluyeIGV = c.precioIncluyeIGV;
      });
    this.reload();
  }

  reload() {
    this.cajaService
      .miSesion()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((s) => this.sesion.set(s));
    this.api
      .productos(true)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((ps) => this.productos.set(ps));
  }

  addToCart(p: ProductoResponse) {
    if (p.stock === 0) {
      this.toast.warning(`"${p.nombre}" sin stock`);
      return;
    }
    this.cart.update((items) => {
      const existing = items.find((i) => i.productoId === p.id);
      if (existing) {
        if (existing.cantidad >= p.stock) {
          this.toast.warning(`Stock máximo de "${p.nombre}"`);
          return items;
        }
        return items.map((i) => (i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [
        ...items,
        {
          productoId: p.id,
          nombre: p.nombre,
          codigo: p.codigo,
          precio: this.precioPorcion(p),
          incluyeIGV: p.incluyeIGV,
          stock: p.stock,
          cantidad: 1,
          ventaPorPeso: p.ventaPorPeso,
          pesoGramos: p.pesoGramos,
        },
      ];
    });
  }

  precioPorcion(p: ProductoResponse): number {
    if (p.ventaPorPeso && p.pesoGramos && p.pesoGramos > 0) {
      return Math.round((p.precioVenta * p.pesoGramos * 100) / 1000) / 100;
    }
    return p.precioVenta;
  }

  inc(item: CartItem) {
    this.cart.update((items) =>
      items.map((i) =>
        i.productoId === item.productoId && i.cantidad < i.stock ? { ...i, cantidad: i.cantidad + 1 } : i
      )
    );
  }

  dec(item: CartItem) {
    this.cart.update((items) =>
      items
        .map((i) => (i.productoId === item.productoId ? { ...i, cantidad: i.cantidad - 1 } : i))
        .filter((i) => i.cantidad > 0)
    );
  }

  remove(item: CartItem) {
    this.cart.update((items) => items.filter((i) => i.productoId !== item.productoId));
  }

  onDescuento(value: string) {
    this.descuento.set(Math.max(0, Number(value) || 0));
  }

  setComprobante(value: string) {
    this.comprobante.set(value as TipoComprobante);
  }

  setTipoPago(value: string) {
    this.tipoPago.set(value as TipoPago);
  }

  onRecibido(value: string) {
    this.recibido.set(Math.max(0, Number(value) || 0));
  }

  onClienteSearch(value: string) {
    this.clienteQ.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.api
        .clientes(value)
        .pipe(takeUntilDestroyed(this.destroy))
        .subscribe((cs) => this.clienteResults.set(cs.slice(0, 6)));
    }, 300);
  }

  selectCliente(c: ClienteResponse) {
    this.cliente.set(c);
    this.clienteResults.set([]);
    this.clienteQ.set('');
  }

  clearCliente() {
    this.cliente.set(null);
  }

  openClienteNuevo() {
    this.clienteForm.reset({ tipoDocumento: this.comprobante() === 'FACTURA' ? 'RUC' : 'DNI', numeroDocumento: '', razonSocial: '' });
    this.clienteOpen.set(true);
  }

  closeClienteNuevo() {
    this.clienteOpen.set(false);
  }

  createCliente() {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }
    const v = this.clienteForm.getRawValue();
    this.api
      .crearCliente({ tipoDocumento: v.tipoDocumento as never, numeroDocumento: v.numeroDocumento, razonSocial: v.razonSocial })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (c) => {
          this.cliente.set(c);
          this.clienteOpen.set(false);
          this.toast.success('Cliente creado');
        },
        error: (e) => this.toast.error(errorMessage(e)),
      });
  }

  cobrar() {
    if (this.cart().length === 0 || this.saving()) return;
    const s = this.sesion();
    if (!s) {
      this.toast.error('Debes abrir una caja primero');
      return;
    }
    if (this.comprobante() === 'FACTURA' && !this.cliente()) {
      this.toast.warning('La factura requiere un cliente con RUC');
      return;
    }
    const c = this.cliente();
    const items = this.cart().map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, descuento: 0 }));
    this.saving.set(true);
    this.ventaService
      .crear({
        clienteId: c?.id ?? null,
        tipoPago: this.tipoPago(),
        tipoComprobante: this.comprobante(),
        descuento: this.descuento() || null,
        items,
      })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (v) => {
          this.saving.set(false);
          this.lastVenta.set(v);
          this.successOpen.set(true);
          this.cart.set([]);
          this.descuento.set(0);
          this.recibido.set(0);
          this.clearCliente();
          window.dispatchEvent(new Event('sesion:changed'));
          this.reload();
        },
        error: (e) => {
          this.saving.set(false);
          this.toast.error(errorMessage(e));
        },
      });
  }

  newSale() {
    this.successOpen.set(false);
    this.q.set('');
  }

  protected readonly money = money;
  protected readonly tipoPagoLabel = tipoPagoLabel;
  protected readonly tipoComprobanteLabel = tipoComprobanteLabel;
}
