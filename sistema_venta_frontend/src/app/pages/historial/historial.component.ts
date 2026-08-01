import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VentaResponse } from '../../core/models';
import { VentaService } from '../../core/services/venta.service';
import { ToastService } from '../../core/services/toast.service';
import { dateTime, errorMessage, money, tipoComprobanteLabel, tipoPagoLabel } from '../../core/utils';
import { ComprobanteModalComponent } from '../../shared/comprobante-modal.component';
import { IconComponent } from '../../shared/icon.component';

type Filtro = 'TODOS' | 'HOY' | 'AYER' | 'MES';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [IconComponent, ComprobanteModalComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Historial de ventas</h1>
          <p class="page-sub">Todas las boletas, facturas y tickets registrados</p>
        </div>
        <div class="page-actions">
          <div class="search-box">
            <app-icon name="search" [size]="16" />
            <input class="input" type="text" [value]="q()" (input)="q.set($any($event.target).value)" placeholder="Buscar comprobante, cliente, vendedor…" />
          </div>
          <div class="tabs-mini">
            <button class="tab" [class.on]="filtro() === 'TODOS'" (click)="filtro.set('TODOS')">Todo</button>
            <button class="tab" [class.on]="filtro() === 'HOY'" (click)="filtro.set('HOY')">Hoy</button>
            <button class="tab" [class.on]="filtro() === 'AYER'" (click)="filtro.set('AYER')">Ayer</button>
            <button class="tab" [class.on]="filtro() === 'MES'" (click)="filtro.set('MES')">Este mes</button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-block"><app-icon name="refresh" [size]="26" /></div>
      } @else {
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Comprobante</th>
                <th>Fecha</th>
                <th>Vendedor</th>
                <th>Caja</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Pago</th>
                <th class="right">Total</th>
                <th class="right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (v of filtradas(); track v.id) {
                <tr>
                  <td><span class="code">{{ comprobante(v) }}</span></td>
                  <td>{{ dateTime(v.fecha) }}</td>
                  <td>{{ v.vendedorNombre }}</td>
                  <td>{{ v.cajaNombre }}</td>
                  <td>{{ v.clienteNombre ?? 'Consumidor final' }}</td>
                  <td>{{ tipoComprobanteLabel(v.tipoComprobante) }}</td>
                  <td>{{ tipoPagoLabel(v.tipoPago) }}</td>
                  <td class="num">{{ money(v.total) }}</td>
                  <td class="right">
                    <div class="actions">
                      <button class="btn btn-ghost btn-xs" (click)="ver(v)"><app-icon name="eye" [size]="14" /> Ver</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9">
                    <div class="empty-state"><app-icon name="history" [size]="30" /><p>No hay ventas</p></div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <app-comprobante-modal [open]="detalleOpen()" [venta]="detalleVenta()" (closed)="detalleOpen.set(false)" />
  `,
  styles: [
    `
      .tabs-mini {
        display: flex;
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: 9px;
        padding: 3px;
        gap: 3px;
      }
      .tab {
        border: 0;
        background: transparent;
        padding: 6px 13px;
        border-radius: 6px;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--text-soft);
        cursor: pointer;
      }
      .tab.on {
        background: #fff;
        color: var(--text);
        box-shadow: var(--shadow-xs);
      }
      .code {
        font-family: ui-monospace, SFMono-Regular, 'Cascadia Mono', Consolas, monospace;
        font-size: 12.5px;
        font-weight: 700;
        color: var(--brand-deep);
        background: var(--brand-softer);
        border-radius: 6px;
        padding: 3px 8px;
        white-space: nowrap;
      }
    `,
  ],
})
export class HistorialComponent implements OnInit {
  private readonly ventaService = inject(VentaService);
  private readonly toast = inject(ToastService);
  private readonly destroy = inject(DestroyRef);

  readonly loading = signal(true);
  readonly ventas = signal<VentaResponse[]>([]);
  readonly q = signal('');
  readonly filtro = signal<Filtro>('TODOS');
  readonly detalleOpen = signal(false);
  readonly detalleVenta = signal<VentaResponse | null>(null);

  readonly filtradas = computed(() => {
    const term = this.q().trim().toLowerCase();
    return this.ventas().filter((v) => {
      if (this.filtro() !== 'TODOS' && !this.coincideFecha(v.fecha, this.filtro())) return false;
      if (!term) return true;
      const doc = this.comprobante(v).toLowerCase();
      return (
        doc.includes(term) ||
        (v.clienteNombre ?? '').toLowerCase().includes(term) ||
        (v.clienteDocumento ?? '').toLowerCase().includes(term) ||
        v.vendedorNombre.toLowerCase().includes(term)
      );
    });
  });

  ngOnInit() {
    this.ventaService
      .ventas()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (vs) => {
          this.ventas.set(vs);
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.toast.error(errorMessage(e));
        },
      });
  }

  ver(v: VentaResponse) {
    this.detalleVenta.set(v);
    this.detalleOpen.set(true);
  }

  comprobante(v: VentaResponse): string {
    return `${v.serie}-${String(v.numero).padStart(4, '0')}`;
  }

  private coincideFecha(fecha: string, filtro: Filtro): boolean {
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return true;
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    if (filtro === 'HOY') {
      return d >= inicio && d < new Date(inicio.getTime() + 86400000);
    }
    if (filtro === 'AYER') {
      const ayer = new Date(inicio.getTime() - 86400000);
      return d >= ayer && d < inicio;
    }
    if (filtro === 'MES') {
      return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth();
    }
    return true;
  }

  protected readonly money = money;
  protected readonly dateTime = dateTime;
  protected readonly tipoPagoLabel = tipoPagoLabel;
  protected readonly tipoComprobanteLabel = tipoComprobanteLabel;
}
