import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CajaResponse, CompraResponse, GrupoVenta, ProductoResponse, ProductoVendido, StockReport, TipoComprobante, TipoPago, UsuarioResponse, VentaResumen, VentaResponse } from '../../core/models';
import { ReporteService, ReporteFiltros } from '../../core/services/reporte.service';
import { ApiService } from '../../core/services/api.service';
import { CajaService } from '../../core/services/caja.service';
import { TIPOS_COMPROBANTE, TIPOS_PAGO, dateTime, money, tipoPagoLabel } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';

type Tab = 'ventas' | 'productos' | 'fechas' | 'vendedores' | 'cajas' | 'pagos' | 'comprobantes' | 'compras' | 'stock';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Reportes</h1>
          <p class="page-sub">Ventas, compras, márgenes y stock de cada caja</p>
        </div>
        <div class="page-actions no-print">
          <button class="btn btn-soft" (click)="imprimir()"><app-icon name="printer" [size]="16" /> Imprimir</button>
        </div>
      </div>

      <div class="filters no-print">
        <div class="filter-grid">
          <div class="field">
            <label class="label">Desde</label>
            <input class="input" type="date" formControlName="desde" />
          </div>
          <div class="field">
            <label class="label">Hasta</label>
            <input class="input" type="date" formControlName="hasta" />
          </div>
          <div class="field">
            <label class="label">Caja</label>
            <select class="select" formControlName="cajaId">
              <option [ngValue]="null">Todas</option>
              @for (c of cajas(); track c.id) {
                <option [ngValue]="c.id">{{ c.nombre }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label class="label">Vendedor</label>
            <select class="select" formControlName="vendedorId">
              <option [ngValue]="null">Todos</option>
              @for (u of usuarios(); track u.id) {
                <option [ngValue]="u.id">{{ u.nombre }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label class="label">Producto</label>
            <select class="select" formControlName="productoId">
              <option [ngValue]="null">Todos</option>
              @for (p of productos(); track p.id) {
                <option [ngValue]="p.id">{{ p.nombre }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label class="label">Tipo de pago</label>
            <select class="select" formControlName="tipoPago">
              <option [ngValue]="null">Todos</option>
              @for (t of TIPOS_PAGO; track t.value) {
                <option [ngValue]="t.value">{{ t.label }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label class="label">Comprobante</label>
            <select class="select" formControlName="tipoComprobante">
              <option [ngValue]="null">Todos</option>
              @for (t of TIPOS_COMPROBANTE; track t.value) {
                <option [ngValue]="t.value">{{ t.label }}</option>
              }
            </select>
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" (click)="apply()"><app-icon name="refresh" [size]="16" /> Aplicar</button>
          <button class="btn btn-ghost" (click)="clear()">Limpiar</button>
        </div>
      </div>

      @if (resumen(); as r) {
        <div class="stats-grid mb-16">
          <div class="stat-card">
            <div class="stat-ic teal"><app-icon name="cart" [size]="18" /></div>
            <div><small>Ventas</small><b>{{ r.cantidad }}</b></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic brand"><app-icon name="wallet" [size]="18" /></div>
            <div><small>Total vendido</small><b>{{ money(r.total) }}</b></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic indigo"><app-icon name="chart" [size]="18" /></div>
            <div><small>IGV</small><b>{{ money(r.igv) }}</b></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic green"><app-icon name="trending-up" [size]="18" /></div>
            <div><small>Ganancia</small><b>{{ money(r.ganancia) }}</b></div>
          </div>
        </div>
      }

      <div class="tabs no-print">
        <button class="tab" [class.on]="tab() === 'ventas'" (click)="tab.set('ventas')">Ventas</button>
        <button class="tab" [class.on]="tab() === 'productos'" (click)="tab.set('productos')">Por producto</button>
        <button class="tab" [class.on]="tab() === 'cajas'" (click)="tab.set('cajas')">Por caja</button>
        <button class="tab" [class.on]="tab() === 'fechas'" (click)="tab.set('fechas')">Por fecha</button>
        <button class="tab" [class.on]="tab() === 'vendedores'" (click)="tab.set('vendedores')">Por vendedor</button>
        <button class="tab" [class.on]="tab() === 'pagos'" (click)="tab.set('pagos')">Por pago</button>
        <button class="tab" [class.on]="tab() === 'comprobantes'" (click)="tab.set('comprobantes')">Por comprobante</button>
        <button class="tab" [class.on]="tab() === 'compras'" (click)="tab.set('compras')">Compras</button>
        <button class="tab" [class.on]="tab() === 'stock'" (click)="tab.set('stock')">Stock</button>
      </div>

      <div class="panel">
        @switch (tab()) {
          @case ('ventas') {
            <div class="table-wrap">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>Comprobante</th>
                    <th>Fecha</th>
                    <th>Caja</th>
                    <th>Vendedor</th>
                    <th>Cliente</th>
                    <th>Pago</th>
                    <th class="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (v of ventas(); track v.id) {
                    <tr>
                      <td><span class="code">{{ v.serie }}-{{ v.numero }}</span></td>
                      <td>{{ dateTime(v.fecha) }}</td>
                      <td>{{ v.cajaNombre }}</td>
                      <td>{{ v.vendedorNombre }}</td>
                      <td>{{ v.clienteNombre ?? 'Consumidor final' }}</td>
                      <td><span class="badge badge-neutral">{{ tipoPagoLabel(v.tipoPago) }}</span></td>
                      <td class="num">{{ money(v.total) }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="7"><div class="empty-state"><app-icon name="file" [size]="34" /><p>Sin ventas en el rango seleccionado</p></div></td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @case ('productos') {
            <div class="table-wrap">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Código</th>
                    <th class="right">Cantidad</th>
                    <th class="right">P. compra</th>
                    <th class="right">P. venta</th>
                    <th class="right">Margen</th>
                    <th class="right">Subtotal</th>
                    <th class="right">Ganancia</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of porProducto(); track p.productoId) {
                    <tr>
                      <td>
                        {{ p.nombre }}
                        @if (p.ventaPorPeso) {
                          <span class="badge badge-neutral">por kg</span>
                        }
                      </td>
                      <td class="code">{{ p.codigo ?? '—' }}</td>
                      <td class="num">{{ p.cantidad }} {{ p.ventaPorPeso ? 'porc.' : 'uds.' }}</td>
                      <td class="num">{{ money(p.precioCompra) }}</td>
                      <td class="num">{{ money(p.precioVenta) }}</td>
                      <td class="num text-green">{{ margenLabel(p.margen) }}</td>
                      <td class="num">{{ money(p.subtotal) }}</td>
                      <td class="num text-green">{{ money(p.ganancia) }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="8"><div class="empty-state"><app-icon name="box" [size]="34" /><p>Sin datos</p></div></td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @case ('cajas') {
            <div class="groups">
              @for (g of porCajas(); track g.grupo) {
                <div class="group-row">
                  <span class="group-label">{{ g.grupo }}</span>
                  <div class="group-bar"><i [style.width.%]="pct(g, porCajas())"></i></div>
                  <span class="group-qty">{{ g.cantidad }} ventas</span>
                  <b class="group-total">{{ money(g.total) }}</b>
                </div>
              } @empty {
                <div class="empty-state"><app-icon name="cash-register" [size]="34" /><p>Sin datos</p></div>
              }
            </div>
          }
          @case ('fechas') {
            <div class="groups">
              @for (g of porFechas(); track g.grupo) {
                <div class="group-row">
                  <span class="group-label">{{ g.grupo }}</span>
                  <div class="group-bar"><i [style.width.%]="pct(g, porFechas())"></i></div>
                  <span class="group-qty">{{ g.cantidad }} ventas</span>
                  <b class="group-total">{{ money(g.total) }}</b>
                </div>
              } @empty {
                <div class="empty-state"><app-icon name="chart" [size]="34" /><p>Sin datos</p></div>
              }
            </div>
          }
          @case ('vendedores') {
            <div class="groups">
              @for (g of porVendedores(); track g.grupo) {
                <div class="group-row">
                  <span class="group-label">{{ g.grupo }}</span>
                  <div class="group-bar"><i [style.width.%]="pct(g, porVendedores())"></i></div>
                  <span class="group-qty">{{ g.cantidad }} ventas</span>
                  <b class="group-total">{{ money(g.total) }}</b>
                </div>
              } @empty {
                <div class="empty-state"><app-icon name="users" [size]="34" /><p>Sin datos</p></div>
              }
            </div>
          }
          @case ('pagos') {
            <div class="groups">
              @for (g of porPagos(); track g.grupo) {
                <div class="group-row">
                  <span class="group-label">{{ tipoPagoLabel(g.grupo) }}</span>
                  <div class="group-bar"><i [style.width.%]="pct(g, porPagos())"></i></div>
                  <span class="group-qty">{{ g.cantidad }} ventas</span>
                  <b class="group-total">{{ money(g.total) }}</b>
                </div>
              } @empty {
                <div class="empty-state"><app-icon name="cash" [size]="34" /><p>Sin datos</p></div>
              }
            </div>
          }
          @case ('comprobantes') {
            <div class="groups">
              @for (g of porComprobantes(); track g.grupo) {
                <div class="group-row">
                  <span class="group-label">{{ comprobanteLabel(g.grupo) }}</span>
                  <div class="group-bar"><i [style.width.%]="pct(g, porComprobantes())"></i></div>
                  <span class="group-qty">{{ g.cantidad }} ventas</span>
                  <b class="group-total">{{ money(g.total) }}</b>
                </div>
              } @empty {
                <div class="empty-state"><app-icon name="file" [size]="34" /><p>Sin datos</p></div>
              }
            </div>
          }
          @case ('compras') {
            <div class="table-wrap">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Proveedor</th>
                    <th>N° Documento</th>
                    <th>Productos</th>
                    <th class="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of compras(); track c.id) {
                    <tr>
                      <td>{{ dateTime(c.fecha) }}</td>
                      <td>{{ c.proveedorNombre }}</td>
                      <td class="code">{{ c.numeroDocumento ?? '—' }}</td>
                      <td>
                        <div class="items-mini">
                          @for (it of c.items; track $index) {
                            <span>{{ it.productoNombre }} ×{{ it.cantidad }} <b>{{ money(it.subtotal) }}</b></span>
                          }
                        </div>
                      </td>
                      <td class="num">{{ money(c.total) }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5"><div class="empty-state"><app-icon name="package" [size]="34" /><p>Sin compras en el rango seleccionado</p></div></td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @case ('stock') {
            <div class="table-wrap">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th class="right">Stock</th>
                    <th class="right">P. compra</th>
                    <th class="right">P. venta</th>
                    <th class="right">Margen</th>
                    <th class="right">Valor costo</th>
                    <th class="right">Valor venta</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of stock(); track s.id) {
                    <tr>
                      <td>
                        {{ s.nombre }}
                        @if (s.ventaPorPeso) {
                          <span class="badge badge-neutral">{{ s.pesoGramos }} g / por kg</span>
                        }
                      </td>
                      <td>{{ s.categoriaNombre ?? '—' }}</td>
                      <td class="num">
                        <span class="badge" [class.badge-success]="s.stock > s.stockMinimo" [class.badge-warning]="s.stock <= s.stockMinimo && s.stock > 0" [class.badge-danger]="s.stock === 0">
                          {{ s.stock }} {{ s.ventaPorPeso ? 'porc.' : 'uds.' }}
                        </span>
                      </td>
                      <td class="num">{{ money(s.precioCompra) }}</td>
                      <td class="num">{{ money(s.precioVenta) }}</td>
                      <td class="num text-green">{{ margenLabel(s.margen) }}</td>
                      <td class="num">{{ money(s.costoInventario) }}</td>
                      <td class="num">{{ money(s.ventaInventario) }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="8"><div class="empty-state"><app-icon name="box" [size]="34" /><p>Sin productos</p></div></td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
      .filters {
        background: #fff;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px;
        margin-bottom: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 10px;
      }
      .filter-actions {
        display: flex;
        gap: 8px;
      }
      .tabs {
        display: flex;
        gap: 4px;
        border-bottom: 1px solid var(--border);
        margin-bottom: 14px;
        overflow-x: auto;
      }
      .tab {
        border: 0;
        background: transparent;
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 700;
        color: var(--text-soft);
        cursor: pointer;
        border-bottom: 2px solid transparent;
        white-space: nowrap;
      }
      .tab.on {
        color: var(--brand-deep);
        border-bottom-color: var(--brand);
      }
      .panel {
        background: #fff;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 8px;
      }
      .code {
        font-weight: 700;
        color: var(--brand);
        font-size: 12.5px;
      }
      .text-green {
        color: var(--success);
        font-weight: 700;
      }
      .groups {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px 6px;
      }
      .group-row {
        display: grid;
        grid-template-columns: 150px 1fr 90px 100px;
        align-items: center;
        gap: 12px;
        padding: 8px 10px;
        border-radius: 9px;
      }
      .group-row:hover {
        background: var(--surface-soft);
      }
      @media (max-width: 700px) {
        .group-row {
          grid-template-columns: 1fr;
          gap: 4px;
        }
      }
      .group-label {
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .group-bar {
        height: 26px;
        background: var(--surface-soft);
        border-radius: 7px;
        overflow: hidden;
      }
      .group-bar i {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, #14b8a6, #0f766e);
        border-radius: 7px;
        min-width: 4px;
      }
      .group-qty {
        color: var(--text-faint);
        font-size: 12px;
        text-align: right;
      }
      .group-total {
        font-size: 13.5px;
        text-align: right;
      }
      .items-mini {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .items-mini span {
        font-size: 12px;
        color: var(--text-soft);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 320px;
      }
      .items-mini b {
        color: var(--text);
      }
    `,
  ],
})
export class ReportesComponent implements OnInit {
  private readonly reporte = inject(ReporteService);
  private readonly api = inject(ApiService);
  private readonly cajaService = inject(CajaService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy = inject(DestroyRef);

  readonly TIPOS_PAGO = TIPOS_PAGO;
  readonly TIPOS_COMPROBANTE = TIPOS_COMPROBANTE;

  readonly tab = signal<Tab>('ventas');
  readonly usuarios = signal<UsuarioResponse[]>([]);
  readonly cajas = signal<CajaResponse[]>([]);
  readonly productos = signal<ProductoResponse[]>([]);
  readonly resumen = signal<VentaResumen | null>(null);
  readonly ventas = signal<VentaResponse[]>([]);
  readonly porProducto = signal<ProductoVendido[]>([]);
  readonly porFechas = signal<GrupoVenta[]>([]);
  readonly porVendedores = signal<GrupoVenta[]>([]);
  readonly porCajas = signal<GrupoVenta[]>([]);
  readonly porPagos = signal<GrupoVenta[]>([]);
  readonly porComprobantes = signal<GrupoVenta[]>([]);
  readonly compras = signal<CompraResponse[]>([]);
  readonly stock = signal<StockReport[]>([]);

  readonly form = this.fb.nonNullable.group({
    desde: [''],
    hasta: [''],
    cajaId: [null as number | null],
    vendedorId: [null as number | null],
    productoId: [null as number | null],
    tipoPago: [null as TipoPago | null],
    tipoComprobante: [null as TipoComprobante | null],
  });

  ngOnInit() {
    this.api.usuarios().pipe(takeUntilDestroyed(this.destroy)).subscribe((us) => this.usuarios.set(us));
    this.api.productos(false).pipe(takeUntilDestroyed(this.destroy)).subscribe((ps) => this.productos.set(ps));
    this.cajaService.cajas().pipe(takeUntilDestroyed(this.destroy)).subscribe((cs) => this.cajas.set(cs));
    this.apply();
  }

  apply() {
    const v = this.form.getRawValue();
    const f: ReporteFiltros = {
      desde: v.desde || null,
      hasta: v.hasta || null,
      cajaId: v.cajaId,
      vendedorId: v.vendedorId,
      productoId: v.productoId,
      tipoPago: v.tipoPago,
      tipoComprobante: v.tipoComprobante,
    };
    this.reporte.resumen(f).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (r) => this.resumen.set(r),
      error: () => this.resumen.set(null),
    });
    this.reporte.ventas(f).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (vs) => this.ventas.set(vs),
      error: () => this.ventas.set([]),
    });
    this.reporte.porProducto(f).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (ps) => this.porProducto.set(ps),
      error: () => this.porProducto.set([]),
    });
    this.reporte.porCaja(f).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (gs) => this.porCajas.set(gs),
      error: () => this.porCajas.set([]),
    });
    this.reporte.porFecha(f).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (gs) => this.porFechas.set(gs),
      error: () => this.porFechas.set([]),
    });
    this.reporte.porVendedor(f).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (gs) => this.porVendedores.set(gs),
      error: () => this.porVendedores.set([]),
    });
    this.reporte.porTipoPago(f).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (gs) => this.porPagos.set(gs),
      error: () => this.porPagos.set([]),
    });
    this.reporte.porComprobante(f).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (gs) => this.porComprobantes.set(gs),
      error: () => this.porComprobantes.set([]),
    });
    this.reporte.compras(f).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (cs) => this.compras.set(cs),
      error: () => this.compras.set([]),
    });
    this.reporte.stock().pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (ss) => this.stock.set(ss),
      error: () => this.stock.set([]),
    });
  }

  clear() {
    this.form.reset({ desde: '', hasta: '', cajaId: null, vendedorId: null, productoId: null, tipoPago: null, tipoComprobante: null });
    this.apply();
  }

  imprimir() {
    window.print();
  }

  pct(g: GrupoVenta, list: GrupoVenta[]): number {
    const max = Math.max(...list.map((x) => x.total), 1);
    return Math.round((g.total / max) * 100);
  }

  comprobanteLabel(value: string) {
    return TIPOS_COMPROBANTE.find((t) => t.value === value)?.label ?? value;
  }

  margenLabel(m: number | null | undefined): string {
    return m === null || m === undefined ? '—' : `${m.toFixed(1)}%`;
  }

  protected readonly money = money;
  protected readonly dateTime = dateTime;
  protected readonly tipoPagoLabel = tipoPagoLabel;
}
