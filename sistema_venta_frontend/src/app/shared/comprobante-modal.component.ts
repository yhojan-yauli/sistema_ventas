import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { printBoleta } from '../core/boleta';
import { ConfiguracionResponse, VentaResponse } from '../core/models';
import { ApiService } from '../core/services/api.service';
import { dateTime, money, tipoComprobanteLabel, tipoPagoLabel } from '../core/utils';
import { EnviarCorreoModalComponent } from './enviar-correo-modal.component';
import { IconComponent } from './icon.component';
import { ModalComponent, ModalFooterDirective } from './modal.component';

@Component({
  selector: 'app-comprobante-modal',
  standalone: true,
  imports: [ModalComponent, ModalFooterDirective, IconComponent, EnviarCorreoModalComponent],
  template: `
    <app-modal [open]="open() && !!venta()" (closed)="closed.emit()" size="md">
      @if (venta(); as v) {
        <span head>{{ comprobante(v) }} · {{ tipoComprobanteLabel(v.tipoComprobante) }}</span>
      }
      @if (venta(); as v) {
        <div class="cb-head">
          <div class="cb-badge">
            <b>{{ comprobante(v) }}</b>
            <small>{{ tipoComprobanteLabel(v.tipoComprobante) }} · {{ tipoPagoLabel(v.tipoPago) }}</small>
          </div>
          <div class="cb-fecha">
            <small>Fecha</small>
            <b>{{ dateTime(v.fecha) }}</b>
          </div>
        </div>

        <div class="cb-fields">
          <div class="cb-field">
            <small>Vendedor</small>
            <b>{{ v.vendedorNombre }}</b>
          </div>
          <div class="cb-field">
            <small>Caja</small>
            <b>{{ v.cajaNombre }}</b>
          </div>
        </div>

        <div class="cb-cliente">
          <div class="cb-cliente-main">
            <small>Cliente</small>
            <b>{{ v.clienteNombre ?? 'Consumidor final' }}</b>
            @if (v.clienteDocumento) {
              <small class="cb-doc">{{ v.clienteDocumento }}</small>
            }
          </div>
          @if (v.clienteTelefono || v.clienteEmail) {
            <div class="cb-contacto">
              @if (v.clienteTelefono) { <span>Tel: {{ v.clienteTelefono }}</span> }
              @if (v.clienteEmail) { <span>{{ v.clienteEmail }}</span> }
            </div>
          }
        </div>

        <table class="cb-tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th class="num">Precio</th>
              <th class="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            @for (it of v.items; track $index) {
              <tr>
                <td>
                  <b>{{ it.productoNombre }}</b>
                  <small>
                    @if (it.pesoGramos) {
                      {{ kg(it.pesoGramos) }} kg
                    } @else {
                      {{ it.cantidad }} × {{ money(it.precioVenta) }}
                    }
                  </small>
                </td>
                <td class="num">{{ money(it.precioVenta) }}</td>
                <td class="num">{{ money(it.subtotal) }}</td>
              </tr>
            }
          </tbody>
        </table>

        <div class="cb-totales">
          <div class="cb-total-row"><span>Subtotal</span><b>{{ money(v.subtotal) }}</b></div>
          @if (v.descuento > 0) {
            <div class="cb-total-row"><span>Descuento</span><b class="neg">-{{ money(v.descuento) }}</b></div>
          }
          <div class="cb-total-row"><span>IGV ({{ v.igvPorcentaje }}%)</span><b>{{ money(v.igv) }}</b></div>
          <div class="cb-total-row grand"><span>Total</span><b>{{ money(v.total) }}</b></div>
        </div>
      }
      @if (venta(); as v) {
        <div foot>
          <button class="btn btn-ghost" (click)="closed.emit()">Cerrar</button>
          <button class="btn btn-outline" (click)="imprimir(v)"><app-icon name="printer" [size]="15" /> Imprimir</button>
          <button class="btn btn-outline" (click)="abrirCorreo(v)"><app-icon name="mail" [size]="15" /> Email</button>
        </div>
      }
    </app-modal>

    <app-enviar-correo-modal [abierto]="correoOpen()" [venta]="correoVenta()" (cerrado)="correoOpen.set(false)" />
  `,
  styles: [
    `
      .cb-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: 12px;
        margin-bottom: 12px;
      }
      .cb-badge {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
      }
      .cb-badge b {
        font-size: 16px;
        letter-spacing: 0.01em;
      }
      .cb-badge small {
        color: var(--text-faint);
        font-size: 12px;
      }
      .cb-fecha {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        line-height: 1.3;
        text-align: right;
      }
      .cb-fecha small {
        color: var(--text-faint);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .cb-fecha b {
        font-size: 12.5px;
      }
      .cb-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 12px;
      }
      @media (max-width: 520px) {
        .cb-fields {
          grid-template-columns: 1fr;
        }
      }
      .cb-field {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
        padding: 10px 12px;
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        background: #fff;
      }
      .cb-field small {
        color: var(--text-faint);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .cb-field b {
        font-size: 13px;
      }
      .cb-cliente {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        padding: 12px 14px;
        border: 1px solid var(--brand-soft);
        border-radius: 10px;
        background: var(--brand-softer);
        margin-bottom: 14px;
      }
      .cb-cliente-main {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
        min-width: 0;
      }
      .cb-cliente-main small {
        color: var(--text-faint);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .cb-cliente-main b {
        font-size: 13px;
        color: var(--brand-deep);
        overflow-wrap: anywhere;
      }
      .cb-cliente-main .cb-doc {
        text-transform: none;
        letter-spacing: 0;
        font-size: 12px;
        color: var(--text-soft);
      }
      .cb-contacto {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        font-size: 11.5px;
        color: var(--text-soft);
        text-align: right;
      }
      .cb-tabla {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 14px;
      }
      .cb-tabla th {
        text-align: left;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--text-faint);
        padding: 6px 8px;
        border-bottom: 1px solid var(--border);
      }
      .cb-tabla th.num {
        text-align: right;
      }
      .cb-tabla td {
        padding: 8px;
        border-bottom: 1px solid var(--border-soft);
        vertical-align: top;
      }
      .cb-tabla td b {
        display: block;
        font-size: 12.5px;
      }
      .cb-tabla td small {
        color: var(--text-faint);
        font-size: 11.5px;
      }
      .cb-tabla td.num {
        text-align: right;
        font-weight: 600;
        font-size: 12.5px;
        white-space: nowrap;
      }
      .cb-totales {
        display: flex;
        flex-direction: column;
        gap: 5px;
        padding: 10px 14px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface-soft);
      }
      .cb-total-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
      }
      .cb-total-row span {
        color: var(--text-soft);
      }
      .cb-total-row .neg {
        color: var(--danger);
      }
      .cb-total-row.grand {
        border-top: 1px solid var(--border);
        padding-top: 8px;
        margin-top: 4px;
      }
      .cb-total-row.grand span {
        font-size: 14px;
        font-weight: 700;
        color: var(--text);
      }
      .cb-total-row.grand b {
        font-size: 20px;
        color: var(--brand-deep);
      }
    `,
  ],
})
export class ComprobanteModalComponent {
  readonly venta = input<VentaResponse | null>(null);
  readonly open = input(false);
  readonly closed = output();

  readonly correoOpen = signal(false);
  readonly correoVenta = signal<VentaResponse | null>(null);

  private readonly api = inject(ApiService);
  private readonly destroy = inject(DestroyRef);
  private readonly negocio = signal<ConfiguracionResponse | null>(null);

  constructor() {
    this.api
      .configuracion()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((c) => this.negocio.set(c));
  }

  private negocioVal(): ConfiguracionResponse {
    return (
      this.negocio() ?? {
        igvPorcentaje: 18,
        precioIncluyeIGV: true,
        razonSocial: '',
        ruc: '',
        direccion: '',
        telefono: '',
        email: '',
        smtpHost: '',
        smtpPort: '587',
        smtpUsername: '',
        smtpPassword: '',
      }
    );
  }

  comprobante(v: VentaResponse): string {
    return `${v.serie}-${String(v.numero).padStart(4, '0')}`;
  }

  kg(gramos: number | null | undefined): string {
    const g = gramos ?? 0;
    return (g / 1000).toFixed(3).replace(/\.?0+$/, '') || '0';
  }

  imprimir(v: VentaResponse) {
    printBoleta(v, this.negocioVal());
  }

  abrirCorreo(v: VentaResponse) {
    this.correoVenta.set(v);
    this.correoOpen.set(true);
  }

  protected readonly money = money;
  protected readonly dateTime = dateTime;
  protected readonly tipoComprobanteLabel = tipoComprobanteLabel;
  protected readonly tipoPagoLabel = tipoPagoLabel;
}
