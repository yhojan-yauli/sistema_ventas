import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CajaResponse } from '../../core/models';
import { CajaService } from '../../core/services/caja.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { date, dateTime, errorMessage, money } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent, ModalFooterDirective } from '../../shared/modal.component';

@Component({
  selector: 'app-cajas',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, ModalComponent, ModalFooterDirective],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Cajas</h1>
          <p class="page-sub">Puntos de venta y su estado operativo</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" (click)="openForm()"><app-icon name="plus" [size]="16" /> Nueva caja</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-block"><app-icon name="refresh" [size]="26" /></div>
      } @else {
        <div class="grid-cajas">
          @for (c of cajas(); track c.id) {
            <div class="caja-card" [class.disabled]="!c.activa">
              <div class="caja-head">
                <div class="caja-info">
                  <div class="avatar soft"><app-icon name="building" [size]="18" /></div>
                  <div>
                    <b>{{ c.nombre }}</b>
                    <small>{{ c.descripcion ?? 'Sin descripción' }}</small>
                  </div>
                </div>
                <span class="badge" [class.badge-success]="c.activa" [class.badge-neutral]="!c.activa">
                  {{ c.activa ? 'Activa' : 'Deshabilitada' }}
                </span>
              </div>
              <div class="caja-saldo">
                <small class="muted">Saldo en caja</small>
                <div class="saldo-line">
                  <b class="money">{{ money(c.saldo) }}</b>
                  <span class="badge" [class.badge-success]="c.saldo > 0" [class.badge-neutral]="c.saldo <= 0">
                    {{ c.saldo > 0 ? 'Continuando' : 'Desde 0' }}
                  </span>
                </div>
                <small class="muted">
                  {{ c.fechaUltimoCierre ? 'Último cierre: ' + dateTime(c.fechaUltimoCierre) : 'Sin cierres registrados' }}
                </small>
              </div>
              <div class="caja-foot">
                <small class="muted">Creada el {{ date(c.fechaCreacion) }}</small>
                <div class="actions">
                  <button class="icon-action" (click)="openForm(c)" title="Editar"><app-icon name="pencil" [size]="15" /></button>
                  <button class="icon-action" (click)="toggleActiva(c)" [title]="c.activa ? 'Deshabilitar' : 'Habilitar'">
                    <app-icon name="power" [size]="15" />
                    <span class="pwr">{{ c.activa ? 'off' : 'on' }}</span>
                  </button>
                  <button class="icon-action danger" (click)="remove(c)" title="Eliminar"><app-icon name="trash" [size]="15" /></button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-state span-2"><app-icon name="building" [size]="34" /><p>No hay cajas registradas</p></div>
          }
        </div>
      }
    </div>

    <app-modal [open]="formOpen()" (closed)="closeForm()" size="sm">
      <span head>{{ editando() ? 'Editar caja' : 'Nueva caja' }}</span>
      <form [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="field mb-12">
          <label class="label">Nombre <span class="opt">obligatorio</span></label>
          <input class="input" formControlName="nombre" placeholder="Ej. Caja principal" autofocus />
          @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
            <span class="field-err">El nombre es obligatorio</span>
          }
        </div>
        <div class="field">
          <label class="label">Descripción</label>
          <input class="input" formControlName="descripcion" placeholder="Ej. Mostrador principal" />
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
      .grid-cajas {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 14px;
      }
      .caja-card {
        background: #fff;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        transition: opacity 0.15s ease;
      }
      .caja-card.disabled {
        opacity: 0.55;
      }
      .caja-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }
      .caja-info {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .caja-info > div:last-child {
        display: flex;
        flex-direction: column;
        line-height: 1.4;
      }
      .caja-info b {
        font-size: 14px;
      }
      .caja-info small {
        color: var(--text-faint);
        font-size: 12px;
      }
      .caja-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid var(--border-soft);
        padding-top: 12px;
      }
      .caja-saldo {
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 10px 12px;
      }
      .caja-saldo > small {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .saldo-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .saldo-line b {
        font-size: 16px;
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
      .icon-action .pwr {
        position: absolute;
        font-size: 8px;
        font-weight: 800;
        margin-top: 14px;
      }
      .span-2 {
        grid-column: 1 / -1;
      }
    `,
  ],
})
export class CajasComponent implements OnInit {
  private readonly cajaService = inject(CajaService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy = inject(DestroyRef);

  readonly cajas = signal<CajaResponse[]>([]);
  readonly loading = signal(true);
  readonly formOpen = signal(false);
  readonly editando = signal(false);
  private editingId: number | null = null;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: [''],
  });

  ngOnInit() {
    this.reload();
  }

  openForm(c?: CajaResponse) {
    this.editingId = c?.id ?? null;
    this.editando.set(!!c);
    this.form.reset({ nombre: c?.nombre ?? '', descripcion: c?.descripcion ?? '' });
    this.formOpen.set(true);
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
    const body = { nombre: v.nombre, descripcion: v.descripcion || undefined, activa: true };
    const call = this.editingId ? this.cajaService.actualizarCaja(this.editingId, body) : this.cajaService.crearCaja(body);
    call.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Caja actualizada' : 'Caja creada');
        this.closeForm();
        this.reload();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  toggleActiva(c: CajaResponse) {
    this.confirm
      .confirm({
        title: c.activa ? 'Deshabilitar caja' : 'Habilitar caja',
        message: c.activa
          ? `La caja "${c.nombre}" no podrá abrir nuevas sesiones. ¿Continuar?`
          : `La caja "${c.nombre}" volverá a estar disponible. ¿Continuar?`,
        confirmText: c.activa ? 'Deshabilitar' : 'Habilitar',
        danger: c.activa,
      })
      .then((ok) => {
        if (!ok) return;
        this.cajaService.actualizarCaja(c.id, { nombre: c.nombre, descripcion: c.descripcion ?? undefined, activa: !c.activa })
          .pipe(takeUntilDestroyed(this.destroy))
          .subscribe({
            next: () => {
              this.toast.success(c.activa ? 'Caja deshabilitada' : 'Caja habilitada');
              this.reload();
            },
            error: (e) => this.toast.error(errorMessage(e)),
          });
      });
  }

  remove(c: CajaResponse) {
    this.confirm
      .confirm({
        title: 'Eliminar caja',
        message: `¿Eliminar "${c.nombre}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        danger: true,
      })
      .then((ok) => {
        if (!ok) return;
        this.cajaService.eliminarCaja(c.id).pipe(takeUntilDestroyed(this.destroy)).subscribe({
          next: () => {
            this.toast.success('Caja eliminada');
            this.reload();
          },
          error: (e) => this.toast.error(errorMessage(e)),
        });
      });
  }

  private reload() {
    this.cajaService
      .cajas()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((cs) => {
        this.cajas.set(cs);
        this.loading.set(false);
      });
  }

  protected readonly date = date;
  protected readonly dateTime = dateTime;
  protected readonly money = money;
}
