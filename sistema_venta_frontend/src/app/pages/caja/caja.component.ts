import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CajaResponse, GastoResponse, RetiroResponse, SesionResponse, TipoPago, VentaResponse } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CajaService } from '../../core/services/caja.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { TIPOS_PAGO, dateTime, errorMessage, money, tipoPagoLabel } from '../../core/utils';
import { ComprobanteModalComponent } from '../../shared/comprobante-modal.component';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent, ModalFooterDirective } from '../../shared/modal.component';

interface MetodoEsperado {
  tipoPago: TipoPago;
  esperado: number;
}

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, ModalComponent, ModalFooterDirective, ComprobanteModalComponent],
  template: `
    @if (loading()) {
      <div class="page"><div class="loading-block"><app-icon name="refresh" [size]="26" /></div></div>
    } @else if (sesion(); as s) {
      <!-- Sesión abierta -->
      <div class="page">
        <div class="page-head">
          <div>
            <h1 class="page-title">Mi caja</h1>
            <p class="page-sub">
              {{ s.cajaNombre }} · abierta por {{ s.usuarioNombre }} · {{ dateTime(s.fechaApertura) }}
            </p>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" (click)="openGasto()"><app-icon name="wallet" [size]="16" /> Gasto</button>
            @if (auth.isAdmin) {
              <button class="btn btn-outline" (click)="openRetiro()"><app-icon name="trending-up" [size]="16" /> Retirar</button>
            }
            <button class="btn btn-danger" (click)="openCierre()"><app-icon name="lock" [size]="16" /> Cerrar caja</button>
          </div>
        </div>

        <div class="stats-grid mb-16">
          <div class="stat-card">
            <div class="stat-ic teal"><app-icon name="cart" [size]="18" /></div>
            <div>
              <small>Ventas de la sesión</small>
              <b>{{ money(s.totalVentas) }}</b>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-ic red"><app-icon name="trending-down" [size]="18" /></div>
            <div>
              <small>Gastos</small>
              <b>{{ money(s.totalGastos) }}</b>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-ic amber"><app-icon name="arrow-right" [size]="18" /></div>
            <div>
              <small>Retiros</small>
              <b>{{ money(s.totalRetiros) }}</b>
            </div>
          </div>
          <div class="stat-card strong">
            <div class="stat-ic brand"><app-icon name="wallet" [size]="18" /></div>
            <div>
              <small>Esperado en caja</small>
              <b>{{ money(s.montoFinalEsperado) }}</b>
            </div>
          </div>
        </div>

        <div class="metodos mb-16">
          <span class="metodos-label">Por método de pago</span>
          @for (m of metodos(); track m) {
            <span class="badge badge-neutral">{{ tipoPagoLabel(m) }}: <b class="money">{{ money(s.ventasPorMetodo[m]) }}</b></span>
          }
        </div>

        <div class="split">
          <section class="panel">
            <div class="panel-head">
              <h2 class="panel-title">Ventas de la sesión</h2>
              <span class="badge badge-neutral">{{ s.totalVentas > 0 ? 'Ver en Reportes' : 'Sin ventas aún' }}</span>
            </div>
            <div class="table-wrap">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>Comprobante</th>
                    <th>Cliente</th>
                    <th class="right">Total</th>
                    <th class="right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (v of ventas(); track v.id) {
                    <tr>
                      <td><span class="code">{{ v.serie }}-{{ v.numero }}</span></td>
                      <td>{{ v.clienteNombre ?? 'Consumidor final' }}</td>
                      <td class="num">{{ money(v.total) }}</td>
                      <td class="right">
                        <div class="actions">
                          <button class="btn btn-ghost btn-xs" (click)="verVenta(v)"><app-icon name="eye" [size]="14" /> Ver</button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4"><div class="empty-state"><app-icon name="cart" [size]="30" /><p>Sin ventas en esta sesión</p></div></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <h2 class="panel-title">Movimientos</h2>
              <div class="tabs-mini">
                <button class="tab" [class.on]="tab() === 'gastos'" (click)="tab.set('gastos')">Gastos</button>
                <button class="tab" [class.on]="tab() === 'retiros'" (click)="tab.set('retiros')">Retiros</button>
              </div>
            </div>

            @if (tab() === 'gastos') {
              <div class="mov-list">
                @for (g of s.gastos; track g.id) {
                  <div class="mov-item">
                    <span class="mov-ic red"><app-icon name="trending-down" [size]="15" /></span>
                    <div class="mov-main">
                      <b>{{ g.concepto }}</b>
                      <small>{{ dateTime(g.fecha) }}</small>
                    </div>
                    <span class="mov-amt neg">{{ money(g.monto) }}</span>
                  </div>
                } @empty {
                  <div class="empty-state"><app-icon name="wallet" [size]="30" /><p>Sin gastos registrados</p></div>
                }
              </div>
            } @else {
              <div class="mov-list">
                @for (r of s.retiros; track r.id) {
                  <div class="mov-item">
                    <span class="mov-ic amber"><app-icon name="arrow-right" [size]="15" /></span>
                    <div class="mov-main">
                      <b>Retiro · {{ tipoPagoLabel(r.tipoPago) }}</b>
                      <small>{{ r.motivo ?? '—' }} · {{ dateTime(r.fecha) }}</small>
                    </div>
                    <span class="mov-amt neg">{{ money(r.monto) }}</span>
                  </div>
                } @empty {
                  <div class="empty-state"><app-icon name="arrow-right" [size]="30" /><p>Sin retiros registrados</p></div>
                }
              </div>
            }
          </section>
        </div>
      </div>
    } @else {
      <!-- Apertura -->
      <div class="page">
        <div class="open-wrap">
          <div class="open-card">
            <div class="open-mark"><app-icon name="cash-register" [size]="30" /></div>
            <h2>Abrir caja</h2>
            <p class="muted">Selecciona la caja con la que trabajarás. La apertura te habilita para registrar ventas.</p>
            <form [formGroup]="abrirForm" (ngSubmit)="abrir()" novalidate>
              <div class="field">
                <label class="label">Caja</label>
                <select class="select" formControlName="cajaId">
                  <option [ngValue]="null" disabled>Selecciona una caja…</option>
                  @for (c of cajasActivas(); track c.id) {
                    <option [ngValue]="c.id">{{ c.nombre }}</option>
                  }
                </select>
              </div>
              @if (cajaSeleccionada(); as c) {
                <div class="saldo-info">
                  <div class="saldo-row">
                    <span class="saldo-ic"><app-icon name="wallet" [size]="15" /></span>
                    <div>
                      <small>Saldo conservado en caja</small>
                      <b class="money">{{ money(c.saldo) }}</b>
                    </div>
                  </div>
                  <p class="muted saldo-note">
                    @if (c.fechaUltimoCierre) {
                      Continuando con lo que quedó al cerrar · {{ dateTime(c.fechaUltimoCierre) }}
                    } @else {
                      Sin cierres previos: se trabaja sobre lo que ingreses.
                    }
                  </p>
                </div>
              }
              <div class="field">
                <label class="label">Monto adicional (S/)</label>
                <input class="input" type="number" step="0.01" min="0" formControlName="adicional" placeholder="0.00" />
                <small class="field-hint">Dinero extra que agregas a lo que ya había en la caja.</small>
              </div>
              <label class="check-row">
                <input type="checkbox" formControlName="empezarDe0" />
                <span>Empezar de 0 (no arrastrar el saldo anterior)</span>
              </label>
              <div class="field">
                <label class="label">Observaciones</label>
                <input class="input" formControlName="observaciones" placeholder="Opcional" />
              </div>
              <div class="apertura-total">
                <span>La caja abrirá con</span>
                <b class="money">{{ money(montoApertura()) }}</b>
              </div>
              <button class="btn btn-primary w-full" [disabled]="opening() || abrirForm.invalid" (click)="abrir()">
                @if (opening()) { <span class="spinner"></span> Abriendo… } @else { <app-icon name="login" [size]="16" /> Abrir caja }
              </button>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Gasto -->
    <app-modal [open]="gastoOpen()" (closed)="closeGasto()" size="sm">
      <span head>Registrar gasto</span>
      <form [formGroup]="gastoForm" (ngSubmit)="saveGasto()" novalidate>
        <div class="field mb-12">
          <label class="label">Concepto <span class="opt">obligatorio</span></label>
          <input class="input" formControlName="concepto" placeholder="Ej. Pago de agua" />
        </div>
        <div class="field mb-12">
          <label class="label">Monto (S/) <span class="opt">obligatorio</span></label>
          <input class="input" type="number" step="0.01" min="0.01" formControlName="monto" />
        </div>
        <div class="field">
          <label class="label">Método de pago</label>
          <select class="select" formControlName="tipoPago">
            <option [ngValue]="null">Sin especificar</option>
            @for (t of TIPOS_PAGO; track t.value) {
              <option [ngValue]="t.value">{{ t.label }}</option>
            }
          </select>
        </div>
      </form>
      <div foot>
        <button class="btn btn-ghost" (click)="closeGasto()">Cancelar</button>
        <button class="btn btn-primary" (click)="saveGasto()">Guardar gasto</button>
      </div>
    </app-modal>

    <!-- Retiro -->
    <app-modal [open]="retiroOpen()" (closed)="closeRetiro()" size="sm">
      <span head>Retirar dinero</span>
      <form [formGroup]="retiroForm" (ngSubmit)="saveRetiro()" novalidate>
        <div class="field mb-12">
          <label class="label">Monto (S/) <span class="opt">obligatorio</span></label>
          <input class="input" type="number" step="0.01" min="0.01" formControlName="monto" />
        </div>
        <div class="field mb-12">
          <label class="label">Método de pago</label>
          <select class="select" formControlName="tipoPago">
            <option [ngValue]="null">Sin especificar</option>
            @for (t of TIPOS_PAGO; track t.value) {
              <option [ngValue]="t.value">{{ t.label }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label class="label">Motivo</label>
          <input class="input" formControlName="motivo" placeholder="Ej. Para compras del día" />
        </div>
      </form>
      <div foot>
        <button class="btn btn-ghost" (click)="closeRetiro()">Cancelar</button>
        <button class="btn btn-primary" (click)="saveRetiro()">Retirar</button>
      </div>
    </app-modal>

    <!-- Cierre de caja -->
    <app-modal [open]="cierreOpen()" (closed)="closeCierre()" size="lg">
      <span head>@if (sesion(); as s) { Cerrar caja · {{ s.cajaNombre }} }</span>
      <p class="muted mb-12">Registra el conteo real por cada método de pago. La diferencia se calcula contra el esperado.</p>
      <form [formGroup]="cierreForm" (ngSubmit)="cerrar()" novalidate>
        <div class="cuadre-grid">
          @for (m of metodosEsperados(); track m.tipoPago) {
            <div class="cuadre-item">
              <div class="cuadre-head">
                <b>{{ tipoPagoLabel(m.tipoPago) }}</b>
                <small>Esperado: {{ money(m.esperado) }}</small>
              </div>
              <input class="input" type="number" step="0.01" [formControlName]="m.tipoPago" placeholder="0.00" />
            </div>
          }
        </div>
        <div class="field mt-12">
          <label class="label">Observaciones</label>
          <textarea class="textarea" formControlName="observaciones" rows="2" placeholder="Opcional"></textarea>
        </div>
      </form>
      <div foot>
        <button class="btn btn-ghost" (click)="closeCierre()">Cancelar</button>
        <button class="btn btn-danger" [disabled]="closing()" (click)="cerrar()">
          @if (closing()) { <span class="spinner"></span> Cerrando… } @else { Confirmar cierre }
        </button>
      </div>
    </app-modal>

    <!-- Ver comprobante -->
    <app-comprobante-modal [open]="detalleOpen()" [venta]="detalleVenta()" (closed)="detalleOpen.set(false)" />
  `,
  styles: [
    `
      .open-wrap {
        display: flex;
        justify-content: center;
        padding: 40px 16px;
      }
      .open-card {
        width: 100%;
        max-width: 400px;
        background: #fff;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 32px;
        box-shadow: var(--shadow);
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .open-card h2 {
        font-size: 20px;
      }
      .open-mark {
        width: 58px;
        height: 58px;
        border-radius: 16px;
        background: var(--brand-soft);
        color: var(--brand-deep);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .metodos {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .metodos-label {
        font-size: 12px;
        color: var(--text-faint);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-right: 4px;
      }
      .money {
        color: var(--text);
      }
      .split {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 16px;
        align-items: start;
      }
      @media (max-width: 980px) {
        .split {
          grid-template-columns: 1fr;
        }
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
        padding: 14px 18px;
        border-bottom: 1px solid var(--border-soft);
      }
      .panel-title {
        font-size: 14px;
        font-weight: 700;
      }
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
        padding: 5px 12px;
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
      .mov-list {
        padding: 6px 0;
      }
      .mov-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 18px;
      }
      .mov-item + .mov-item {
        border-top: 1px solid var(--border-soft);
      }
      .mov-ic {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .mov-ic.red {
        background: var(--danger-soft);
        color: var(--danger);
      }
      .mov-ic.amber {
        background: var(--warning-soft);
        color: #b45309;
      }
      .mov-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        line-height: 1.3;
        min-width: 0;
      }
      .mov-main b {
        font-size: 13px;
      }
      .mov-main small {
        color: var(--text-faint);
        font-size: 11.5px;
      }
      .mov-amt.neg {
        color: var(--danger);
        font-weight: 700;
        font-size: 13px;
      }
      .cuadre-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      @media (max-width: 700px) {
        .cuadre-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
      .cuadre-item {
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .cuadre-head {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
      }
      .cuadre-head b {
        font-size: 13px;
      }
      .cuadre-head small {
        color: var(--text-faint);
        font-size: 11.5px;
      }
      .saldo-info {
        background: var(--brand-softer);
        border: 1px solid var(--brand-soft);
        border-radius: 10px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .saldo-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .saldo-ic {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background: var(--brand-soft);
        color: var(--brand-deep);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .saldo-row > div {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
      }
      .saldo-row small {
        color: var(--text-faint);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .saldo-row b {
        font-size: 16px;
      }
      .saldo-note {
        margin: 0;
        font-size: 12px;
      }
      .field-hint {
        display: block;
        color: var(--text-faint);
        font-size: 11.5px;
        margin-top: 4px;
      }
      .check-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--text-soft);
        cursor: pointer;
        margin: 2px 0 4px;
      }
      .check-row input {
        accent-color: var(--brand);
        width: 15px;
        height: 15px;
        cursor: pointer;
      }
      .apertura-total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 13px;
      }
      .apertura-total b {
        font-size: 15px;
      }
    `,
  ],
})
export class CajaComponent implements OnInit {
  private readonly cajaService = inject(CajaService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy = inject(DestroyRef);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly sesion = signal<SesionResponse | null>(null);
  readonly cajasActivas = signal<CajaResponse[]>([]);
  readonly ventas = signal<VentaResponse[]>([]);
  readonly tab = signal<'gastos' | 'retiros'>('gastos');

  readonly gastoOpen = signal(false);
  readonly retiroOpen = signal(false);
  readonly cierreOpen = signal(false);
  readonly opening = signal(false);
  readonly closing = signal(false);
  readonly detalleOpen = signal(false);
  readonly detalleVenta = signal<VentaResponse | null>(null);

  readonly TIPOS_PAGO = TIPOS_PAGO;
  private readonly METODOS: TipoPago[] = TIPOS_PAGO.map((t) => t.value as TipoPago);

  readonly abrirForm = this.fb.nonNullable.group({
    cajaId: [null as number | null, Validators.required],
    adicional: [0],
    empezarDe0: [false],
    observaciones: [''],
  });

  readonly gastoForm = this.fb.nonNullable.group({
    concepto: ['', Validators.required],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    tipoPago: [null as TipoPago | null],
  });

  readonly retiroForm = this.fb.nonNullable.group({
    monto: [0, [Validators.required, Validators.min(0.01)]],
    tipoPago: [null as TipoPago | null],
    motivo: [''],
  });

  readonly cierreForm = this.fb.nonNullable.group({
    observaciones: [''],
  });

  readonly metodos = computed(() => {
    const s = this.sesion();
    return s ? this.METODOS.filter((m) => (s.ventasPorMetodo[m] ?? 0) > 0) : [];
  });

  readonly cajaSeleccionada = computed<CajaResponse | null>(() => {
    const id = this.abrirForm.controls.cajaId.value;
    return this.cajasActivas().find((c) => c.id === id) ?? null;
  });

  readonly montoApertura = computed(() => {
    const c = this.cajaSeleccionada();
    const base = this.abrirForm.controls.empezarDe0.value ? 0 : (c?.saldo ?? 0);
    const adicional = this.abrirForm.controls.adicional.value || 0;
    return Math.round((base + adicional) * 100) / 100;
  });

  readonly metodosEsperados = computed<MetodoEsperado[]>(() => {
    const s = this.sesion();
    if (!s) return [];
    const gastos = new Map<string, number>();
    const retiros = new Map<string, number>();
    for (const g of s.gastos) {
      if (g.tipoPago) gastos.set(g.tipoPago, (gastos.get(g.tipoPago) ?? 0) + g.monto);
    }
    for (const r of s.retiros) {
      if (r.tipoPago) retiros.set(r.tipoPago, (retiros.get(r.tipoPago) ?? 0) + r.monto);
    }
    return this.METODOS.map((m) => {
      const ventas = s.ventasPorMetodo[m] ?? 0;
      let esperado = ventas - (gastos.get(m) ?? 0) - (retiros.get(m) ?? 0);
      if (m === 'EFECTIVO') esperado += s.montoInicial;
      return { tipoPago: m, esperado: Math.round(esperado * 100) / 100 };
    }).filter((m) => m.esperado !== 0 || this.metodos().includes(m.tipoPago));
  });

  ngOnInit() {
    this.refresh();
  }

  private refresh() {
    this.cajaService.cajasActivas().pipe(takeUntilDestroyed(this.destroy)).subscribe((cs) => this.cajasActivas.set(cs));
    this.cajaService
      .miSesion()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (s) => {
          this.sesion.set(s);
          this.loading.set(false);
          if (s) this.loadVentas(s.id);
        },
        error: () => this.loading.set(false),
      });
  }

  private loadVentas(sesionId: number) {
    this.cajaService
      .ventasPorSesion(sesionId)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((vs) => this.ventas.set(vs));
  }

  verVenta(v: VentaResponse) {
    this.detalleVenta.set(v);
    this.detalleOpen.set(true);
  }

  abrir() {
    if (this.abrirForm.invalid || this.opening()) return;
    const v = this.abrirForm.getRawValue();
    this.opening.set(true);
    this.cajaService
      .abrirSesion({
        cajaId: v.cajaId!,
        montoInicial: this.montoApertura(),
        observaciones: v.observaciones || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (s) => {
          this.opening.set(false);
          this.toast.success(`Caja "${s.cajaNombre}" abierta`);
          window.dispatchEvent(new Event('sesion:changed'));
          this.refresh();
        },
        error: (e) => {
          this.opening.set(false);
          this.toast.error(errorMessage(e));
        },
      });
  }

  openGasto() {
    this.gastoForm.reset({ concepto: '', monto: 0, tipoPago: null });
    this.gastoOpen.set(true);
  }
  closeGasto() {
    this.gastoOpen.set(false);
  }
  saveGasto() {
    const s = this.sesion();
    if (!s || this.gastoForm.invalid) return;
    const v = this.gastoForm.getRawValue();
    this.cajaService
      .crearGasto(s.id, { concepto: v.concepto, monto: v.monto, tipoPago: v.tipoPago ?? undefined })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.toast.success('Gasto registrado');
          this.closeGasto();
          this.refresh();
        },
        error: (e) => this.toast.error(errorMessage(e)),
      });
  }

  openRetiro() {
    this.retiroForm.reset({ monto: 0, tipoPago: null, motivo: '' });
    this.retiroOpen.set(true);
  }
  closeRetiro() {
    this.retiroOpen.set(false);
  }
  saveRetiro() {
    const s = this.sesion();
    if (!s || this.retiroForm.invalid) return;
    const v = this.retiroForm.getRawValue();
    this.cajaService
      .crearRetiro(s.id, { monto: v.monto, tipoPago: v.tipoPago ?? undefined, motivo: v.motivo || undefined })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.toast.success('Retiro registrado');
          this.closeRetiro();
          this.refresh();
        },
        error: (e) => this.toast.error(errorMessage(e)),
      });
  }

  openCierre() {
    const cierreControls: Record<string, unknown> = { observaciones: '' };
    for (const m of this.metodosEsperados()) {
      cierreControls[m.tipoPago] = m.esperado;
    }
    this.cierreForm.reset(cierreControls);
    this.cierreOpen.set(true);
  }
  closeCierre() {
    this.cierreOpen.set(false);
  }
  cerrar() {
    const s = this.sesion();
    if (!s || this.closing()) return;
    this.confirm
      .confirm({
        title: 'Confirmar cierre',
        message: 'Al cerrar la caja no podrás registrar más ventas. ¿Continuar?',
        confirmText: 'Sí, cerrar',
        danger: true,
      })
      .then((ok) => {
        if (!ok) return;
        const raw = this.cierreForm.getRawValue() as Record<string, unknown>;
        const cuadre = this.metodosEsperados().map((m) => {
          const valor = raw[m.tipoPago];
          return { tipoPago: m.tipoPago, montoReal: typeof valor === 'number' ? valor : null };
        });
        this.closing.set(true);
        this.cajaService
          .cerrarSesion(s.id, { observaciones: (raw['observaciones'] as string) || undefined, cuadre })
          .pipe(takeUntilDestroyed(this.destroy))
          .subscribe({
            next: () => {
              this.closing.set(false);
              this.toast.success('Caja cerrada correctamente');
              window.dispatchEvent(new Event('sesion:changed'));
              this.closeCierre();
              this.refresh();
            },
            error: (e) => {
              this.closing.set(false);
              this.toast.error(errorMessage(e));
            },
          });
      });
  }

  protected readonly money = money;
  protected readonly dateTime = dateTime;
  protected readonly tipoPagoLabel = tipoPagoLabel;
}
