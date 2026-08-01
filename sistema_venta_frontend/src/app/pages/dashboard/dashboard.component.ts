import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CajaResponse, DashboardResponse, GrupoVenta, ProductoResponse, SesionResponse } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CajaService } from '../../core/services/caja.service';
import { ReporteService } from '../../core/services/reporte.service';
import { date, dateTime, money } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IconComponent, RouterLink],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Inicio</h1>
          <p class="page-sub">Resumen del negocio · {{ hoy }}</p>
        </div>
        <div class="page-actions">
          <a class="btn btn-primary" routerLink="/ventas"><app-icon name="plus" [size]="16" /> Nueva venta</a>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-block"><app-icon name="refresh" [size]="26" /></div>
      } @else if (dashError()) {
        <div class="card card-pad warn-card">
          <div class="warn-row">
            <span class="warn-ic"><app-icon name="alert" [size]="20" /></span>
            <div>
              <b>No se pudo cargar el resumen</b>
              <p class="muted">Ocurrió un error en el servidor al calcular las cifras. Las demás secciones siguen funcionando.</p>
            </div>
          </div>
        </div>
      } @else if (dash(); as d) {
        <div class="stats-grid">
          <div class="kpi">
            <span class="kpi-icon teal"><app-icon name="cash" [size]="20" /></span>
            <div>
              <small>Ventas de hoy</small>
              <b class="money">{{ money(d.ventasHoy) }}</b>
            </div>
          </div>
          <div class="kpi">
            <span class="kpi-icon blue"><app-icon name="cart" [size]="20" /></span>
            <div>
              <small>Ventas de hoy</small>
              <b>{{ d.ventasHoyCantidad }} <span class="unit">operaciones</span></b>
            </div>
          </div>
          <div class="kpi">
            <span class="kpi-icon green"><app-icon name="trending-up" [size]="20" /></span>
            <div>
              <small>Ganancia de hoy</small>
              <b class="money">{{ money(d.gananciaHoy) }}</b>
            </div>
          </div>
          <div class="kpi">
            <span class="kpi-icon amber"><app-icon name="chart" [size]="20" /></span>
            <div>
              <small>Ventas del mes</small>
              <b class="money">{{ money(d.ventasDelMes) }}</b>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="card card-pad">
            <div class="card-head">
              <h3 class="card-title">Ventas por día</h3>
              <span class="muted">Este mes</span>
            </div>
            <div class="bars">
              @for (g of porFecha(); track $index) {
                <div class="bar-col" [title]="g.grupo + ' · ' + money(g.total)">
                  <div class="bar" [style.height.%]="barHeight(g)"></div>
                  <span class="bar-label">{{ g.grupo.split('-')[2] }}</span>
                </div>
              } @empty {
                <div class="empty-state"><app-icon name="chart" [size]="34" /><p>Sin ventas este mes</p></div>
              }
            </div>
          </div>

          <div class="card card-pad">
            <div class="card-head">
              <h3 class="card-title">Stock bajo</h3>
              <a class="link" routerLink="/productos">Ver todos</a>
            </div>
            @if (stockBajo().length === 0) {
              <div class="ok-stock">
                <app-icon name="check" [size]="18" />
                <span>Todo el stock está por encima del mínimo.</span>
              </div>
            } @else {
              <ul class="stock-list">
                @for (p of stockBajo(); track p.id) {
                  <li>
                    <div class="stock-info">
                      <b>{{ p.nombre }}</b>
                      <small>{{ p.codigo ?? '—' }} · {{ p.categoriaNombre ?? 'Sin categoría' }}</small>
                    </div>
                    <span class="badge badge-danger">{{ p.stock }} uds.</span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>

        <div class="stats-grid mt-16">
          <div class="mini-stat">
            <app-icon name="cash-register" [size]="18" class="teal" />
            <div>
              <small>Sesiones abiertas</small>
              <b>{{ d.sesionesAbiertas }}</b>
            </div>
          </div>
          <div class="mini-stat">
            <app-icon name="box" [size]="18" class="amber" />
            <div>
              <small>Productos con stock bajo</small>
              <b>{{ d.stockBajo }}</b>
            </div>
          </div>
        </div>

        @if (auth.isAdmin) {
          <div class="card card-pad mt-16">
            <div class="card-head">
              <h3 class="card-title">Cajas</h3>
              <a class="link" routerLink="/cajas">Administrar</a>
            </div>
            @if (cajas().length === 0) {
              <div class="empty-state"><app-icon name="building" [size]="30" /><p>No hay cajas registradas</p></div>
            } @else {
              <div class="caja-grid">
                @for (c of cajas(); track c.id) {
                  <div class="caja-kpi" [class.muted-box]="!c.activa">
                    <div class="ck-head">
                      <span class="avatar soft"><app-icon name="building" [size]="15" /></span>
                      <div>
                        <b>{{ c.nombre }}</b>
                        <small>
                          @if (abiertaEn(c.id); as s) {
                            Abierta por {{ s.usuarioNombre }} · desde {{ dateTime(s.fechaApertura) }}
                          } @else if (c.fechaUltimoCierre) {
                            Cerrada · continuando desde {{ dateTime(c.fechaUltimoCierre) }}
                          } @else {
                            Sin cierres previos
                          }
                        </small>
                      </div>
                    </div>
                    <div class="ck-saldo">
                      <small>Saldo conservado</small>
                      <b class="money">{{ money(c.saldo) }}</b>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .kpi {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow);
        padding: 18px;
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .warn-card {
        margin-top: 16px;
      }
      .warn-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      .warn-row b {
        font-size: 14px;
      }
      .warn-row p {
        margin: 2px 0 0;
        font-size: 13px;
      }
      .warn-ic {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: var(--danger-soft);
        color: var(--danger);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .kpi-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .kpi-icon.teal {
        background: var(--brand-soft);
        color: var(--brand);
      }
      .kpi-icon.blue {
        background: var(--info-soft);
        color: var(--info);
      }
      .kpi-icon.green {
        background: var(--success-soft);
        color: var(--success);
      }
      .kpi-icon.amber {
        background: var(--accent-soft);
        color: #b45309;
      }
      .kpi small {
        display: block;
        color: var(--text-faint);
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 3px;
      }
      .kpi b {
        font-size: 20px;
        letter-spacing: -0.02em;
      }
      .unit {
        font-size: 12px;
        color: var(--text-faint);
        font-weight: 600;
      }
      .dashboard-grid {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: 16px;
        margin-top: 16px;
      }
      @media (max-width: 1000px) {
        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }
      .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .link {
        font-size: 13px;
        font-weight: 700;
      }
      .bars {
        display: flex;
        align-items: flex-end;
        gap: 3px;
        height: 150px;
      }
      .bar-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        height: 100%;
        justify-content: flex-end;
      }
      .bar {
        width: 100%;
        max-width: 22px;
        background: linear-gradient(180deg, #14b8a6, #0f766e);
        border-radius: 5px 5px 2px 2px;
        min-height: 2px;
        transition: height 0.3s ease;
      }
      .bar-label {
        font-size: 10.5px;
        color: var(--text-faint);
        font-weight: 600;
      }
      .ok-stock {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--success);
        background: var(--success-soft);
        border: 1px solid #bbf7d0;
        border-radius: var(--radius);
        padding: 14px;
        font-weight: 600;
        font-size: 13px;
      }
      .stock-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
      }
      .stock-list li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 11px 0;
        border-bottom: 1px solid var(--border);
      }
      .stock-list li:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }
      .stock-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        line-height: 1.35;
      }
      .stock-info b {
        font-size: 13.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .stock-info small {
        color: var(--text-faint);
        font-size: 12px;
      }
      .mini-stat {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 16px 18px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .mini-stat app-icon {
        color: var(--brand);
      }
      .mini-stat app-icon.amber {
        color: #b45309;
      }
      .mini-stat small {
        display: block;
        color: var(--text-faint);
        font-size: 12px;
        font-weight: 600;
      }
      .mini-stat b {
        font-size: 18px;
      }
      .caja-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 12px;
      }
      .caja-kpi {
        display: flex;
        flex-direction: column;
        gap: 12px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 14px;
        background: var(--surface);
        transition: opacity 0.15s ease;
      }
      .caja-kpi.muted-box {
        opacity: 0.55;
      }
      .ck-head {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .ck-head > div {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
        min-width: 0;
      }
      .ck-head b {
        font-size: 13.5px;
      }
      .ck-head small {
        color: var(--text-faint);
        font-size: 11.5px;
      }
      .ck-saldo {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid var(--border-soft);
        padding-top: 10px;
      }
      .ck-saldo small {
        color: var(--text-faint);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .ck-saldo b {
        font-size: 15px;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly reporte = inject(ReporteService);
  private readonly cajaService = inject(CajaService);
  private readonly destroy = inject(DestroyRef);
  readonly auth = inject(AuthService);

  readonly dash = signal<DashboardResponse | null>(null);
  readonly porFecha = signal<GrupoVenta[]>([]);
  readonly stockBajo = signal<ProductoResponse[]>([]);
  readonly cajas = signal<CajaResponse[]>([]);
  readonly activas = signal<SesionResponse[]>([]);
  readonly loading = signal(true);
  readonly dashError = signal(false);
  readonly hoy = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

  private max = 0;

  ngOnInit() {
    const now = new Date();
    const desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    this.reporte.dashboard().pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (d) => {
        this.dash.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.dashError.set(true);
        this.loading.set(false);
      },
    });
    this.reporte
      .porFecha({ desde, hasta })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (g) => {
          this.porFecha.set(g);
          this.max = Math.max(...g.map((x) => x.total), 1);
        },
        error: () => this.porFecha.set([]),
      });
    this.api.stockBajo().pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (s) => this.stockBajo.set(s.slice(0, 8)),
      error: () => this.stockBajo.set([]),
    });
    if (this.auth.isAdmin) {
      this.cajaService
        .cajas()
        .pipe(takeUntilDestroyed(this.destroy))
        .subscribe({
          next: (cs) => this.cajas.set(cs),
          error: () => this.cajas.set([]),
        });
      this.cajaService
        .sesionesActivas()
        .pipe(takeUntilDestroyed(this.destroy))
        .subscribe({
          next: (ss) => this.activas.set(ss),
          error: () => this.activas.set([]),
        });
    }
  }

  abiertaEn(cajaId: number): SesionResponse | null {
    return this.activas().find((s) => s.cajaId === cajaId) ?? null;
  }

  barHeight(g: GrupoVenta): number {
    return Math.max(3, Math.round((g.total / this.max) * 100));
  }

  protected readonly money = money;
  protected readonly date = date;
  protected readonly dateTime = dateTime;
}
