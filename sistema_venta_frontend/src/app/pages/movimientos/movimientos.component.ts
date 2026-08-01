import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CajaResponse, SesionResponse } from '../../core/models';
import { CajaService } from '../../core/services/caja.service';
import { dateTime, money, tipoPagoLabel } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';

interface SesionCuadre extends SesionResponse {
  ingresos: number;
  egresos: number;
  diferenciaReal: number;
  cuadra: boolean;
}

interface CajaLedger {
  caja: CajaResponse;
  sesiones: SesionCuadre[];
}

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Movimientos de caja</h1>
          <p class="page-sub">Aperturas y cierres por caja, con sus entradas y salidas. Todo cuadra: inicial + ventas − gastos − retiros = saldo final.</p>
        </div>
        <div class="page-actions">
          <select class="select" (change)="filtroCaja.set(+$any($event.target).value)">
            <option value="0">Todas las cajas</option>
            @for (c of cajas(); track c.id) {
              <option [value]="c.id">{{ c.nombre }}</option>
            }
          </select>
        </div>
      </div>

      <div class="tabs mb-16">
        <button class="tab" [class.on]="tab() === 'sesiones'" (click)="tab.set('sesiones')">Aperturas / cierres</button>
        <button class="tab" [class.on]="tab() === 'movimientos'" (click)="tab.set('movimientos')">Entradas y salidas</button>
      </div>

      @if (loading()) {
        <div class="loading-block"><app-icon name="refresh" [size]="26" /></div>
      } @else if (tab() === 'sesiones') {
        @if (sesionesFiltradas().length === 0) {
          <div class="empty-state"><app-icon name="history" [size]="34" /><p>Sin sesiones registradas</p></div>
        } @else {
          <div class="table-wrap">
            <table class="tbl">
              <thead>
                <tr>
                  <th>Caja</th>
                  <th>Usuario</th>
                  <th>Apertura</th>
                  <th>Cierre</th>
                  <th class="right">Inicial</th>
                  <th class="right">Ventas</th>
                  <th class="right">Gastos</th>
                  <th class="right">Retiros</th>
                  <th class="right">Saldo final</th>
                  <th class="right">Cuadre</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (s of sesionesFiltradas(); track s.id) {
                  <tr>
                    <td><b>{{ s.cajaNombre }}</b></td>
                    <td>{{ s.usuarioNombre }}</td>
                    <td class="nowrap">{{ dateTime(s.fechaApertura) }}</td>
                    <td class="nowrap">{{ dateTime(s.fechaCierre) }}</td>
                    <td class="num">{{ money(s.montoInicial) }}</td>
                    <td class="num pos">{{ money(s.ingresos) }}</td>
                    <td class="num neg">{{ money(s.totalGastos) }}</td>
                    <td class="num neg">{{ money(s.totalRetiros) }}</td>
                    <td class="num"><b>{{ money(s.montoFinalEsperado) }}</b></td>
                    <td class="right">
                      <span class="badge" [class.badge-success]="s.cuadra" [class.badge-danger]="!s.cuadra">
                        {{ s.cuadra ? 'Cuadra' : 'Dif ' + money(s.diferenciaReal) }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [class.badge-success]="s.estado === 'ABIERTA'" [class.badge-neutral]="s.estado !== 'ABIERTA'">
                        {{ s.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="muted mt-12">
            Fórmula de cuadre: <b>inicial + ventas − gastos − retiros = saldo final</b>. La columna Cuadre usa el conteo
            real del cierre (diferencia por método de pago).
          </p>
        }
      } @else {
        @if (ledgers().length === 0) {
          <div class="empty-state"><app-icon name="wallet" [size]="34" /><p>Sin movimientos que mostrar</p></div>
        } @else {
          <div class="ledger-grid">
            @for (l of ledgers(); track l.caja.id) {
              <section class="panel">
                <div class="panel-head">
                  <div class="caja-title">
                    <span class="avatar soft"><app-icon name="building" [size]="16" /></span>
                    <div>
                      <b>{{ l.caja.nombre }}</b>
                      <small>
                        @if (l.caja.fechaUltimoCierre) {
                          continuando desde {{ dateTime(l.caja.fechaUltimoCierre) }}
                        } @else {
                          sin cierres previos
                        }
                      </small>
                    </div>
                  </div>
                  <span class="saldo-chip">Saldo <b class="money">{{ money(l.caja.saldo) }}</b></span>
                </div>
                @for (s of l.sesiones; track s.id) {
                  <div class="ledger-item">
                    <div class="ledger-head">
                      <span class="badge" [class.badge-success]="s.estado === 'ABIERTA'" [class.badge-neutral]="s.estado !== 'ABIERTA'">
                        {{ s.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada' }}
                      </span>
                      <b>{{ s.usuarioNombre }}</b>
                      <small>{{ dateTime(s.fechaApertura) }}</small>
                    </div>
                    <div class="ledger-lines">
                      <div class="ledger-line"><span>Apertura</span><b class="pos">+{{ money(s.montoInicial) }}</b></div>
                      <div class="ledger-line"><span>Ventas</span><b class="pos">+{{ money(s.ingresos) }}</b></div>
                      <div class="ledger-line"><span>Gastos</span><b class="neg">−{{ money(s.totalGastos) }}</b></div>
                      <div class="ledger-line"><span>Retiros</span><b class="neg">−{{ money(s.totalRetiros) }}</b></div>
                      @if (s.retiros.length > 0) {
                        <div class="ledger-sub">
                          @for (r of s.retiros; track r.id) {
                            <span>{{ tipoPagoLabel(r.tipoPago) }} · {{ r.usuarioNombre }} · {{ r.motivo ?? '—' }}</span>
                          }
                        </div>
                      }
                      <div class="ledger-line total">
                        <span>Saldo al cierre{{ s.estado === 'ABIERTA' ? ' (parcial)' : '' }}</span>
                        <b class="money">{{ money(s.montoFinalEsperado) }}</b>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="ledger-empty">Sin sesiones para esta caja</div>
                }
              </section>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .tabs {
        display: inline-flex;
        gap: 4px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 4px;
      }
      .tab {
        border: 0;
        background: transparent;
        padding: 8px 16px;
        border-radius: 7px;
        font-size: 13px;
        font-weight: 700;
        color: var(--text-soft);
        cursor: pointer;
      }
      .tab.on {
        background: #fff;
        color: var(--text);
        box-shadow: var(--shadow-xs);
      }
      .nowrap {
        white-space: nowrap;
      }
      .num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .pos {
        color: var(--success);
      }
      .neg {
        color: var(--danger);
      }
      .ledger-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 16px;
        align-items: start;
      }
      .panel {
        background: #fff;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
      }
      .panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 14px 16px;
        border-bottom: 1px solid var(--border-soft);
      }
      .caja-title {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .caja-title > div {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
        min-width: 0;
      }
      .caja-title b {
        font-size: 13.5px;
      }
      .caja-title small {
        color: var(--text-faint);
        font-size: 11px;
      }
      .avatar.soft {
        background: var(--brand-soft);
        color: var(--brand-deep);
      }
      .saldo-chip {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        font-size: 11px;
        color: var(--text-faint);
        font-weight: 600;
        white-space: nowrap;
      }
      .saldo-chip b {
        font-size: 14px;
      }
      .ledger-item {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-soft);
      }
      .ledger-item:last-child {
        border-bottom: 0;
      }
      .ledger-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .ledger-head b {
        font-size: 12.5px;
        flex: 1;
      }
      .ledger-head small {
        color: var(--text-faint);
        font-size: 11px;
      }
      .ledger-lines {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .ledger-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12.5px;
        color: var(--text-soft);
      }
      .ledger-line b {
        font-size: 12.5px;
      }
      .ledger-line.total {
        border-top: 1px dashed var(--border);
        margin-top: 6px;
        padding-top: 6px;
        font-weight: 700;
        color: var(--text);
      }
      .ledger-sub {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-left: 8px;
        border-left: 2px solid var(--border-soft);
        margin: 2px 0;
      }
      .ledger-sub span {
        font-size: 11px;
        color: var(--text-faint);
      }
      .ledger-empty {
        padding: 24px 16px;
        text-align: center;
        color: var(--text-faint);
        font-size: 13px;
      }
    `,
  ],
})
export class MovimientosComponent implements OnInit {
  private readonly cajaService = inject(CajaService);
  private readonly destroy = inject(DestroyRef);

  readonly tab = signal<'sesiones' | 'movimientos'>('sesiones');
  readonly loading = signal(true);
  readonly filtroCaja = signal(0);

  readonly cajas = signal<CajaResponse[]>([]);
  readonly historial = signal<SesionResponse[]>([]);

  readonly sesiones = computed<SesionCuadre[]>(() =>
    this.historial().map((s) => {
      const ingresos = s.totalVentas;
      const egresos = s.totalGastos + s.totalRetiros;
      const diferenciaReal = s.cuadre.reduce((acc, c) => acc + (c.diferencia ?? 0), 0);
      return {
        ...s,
        ingresos,
        egresos,
        diferenciaReal,
        cuadra: Math.abs(diferenciaReal) < 0.01,
      };
    })
  );

  readonly sesionesFiltradas = computed<SesionCuadre[]>(() => {
    const f = this.filtroCaja();
    return this.sesiones().filter((s) => f === 0 || s.cajaId === f);
  });

  readonly ledgers = computed<CajaLedger[]>(() => {
    const f = this.filtroCaja();
    return this.cajas()
      .filter((c) => f === 0 || c.id === f)
      .map((caja) => ({
        caja,
        sesiones: this.sesiones().filter((s) => s.cajaId === caja.id),
      }));
  });

  ngOnInit() {
    this.cajaService
      .cajas()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((cs) => {
        this.cajas.set(cs);
        this.checkLoaded();
      });
    this.cajaService
      .historialSesiones()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((ss) => {
        this.historial.set(ss);
        this.checkLoaded();
      });
  }

  private checkLoaded() {
    if (this.cajas().length > 0 || this.historial().length > 0) {
      this.loading.set(false);
    }
  }

  protected readonly money = money;
  protected readonly dateTime = dateTime;
  protected readonly tipoPagoLabel = tipoPagoLabel;
}
