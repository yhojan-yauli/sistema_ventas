import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfiguracionResponse } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Configuración</h1>
          <p class="page-sub">Datos del negocio y parámetros de facturación</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-block"><app-icon name="refresh" [size]="26" /></div>
      } @else {
        <div class="config-grid">
          <section class="config-card">
            <div class="config-card-head">
              <span class="avatar soft"><app-icon name="settings" [size]="18" /></span>
              <div>
                <h2>Impuestos</h2>
                <small>Parámetros de IGV para el cálculo de ventas</small>
              </div>
            </div>
            <form [formGroup]="impuestosForm" novalidate>
              <div class="field">
                <label class="label">IGV (%) <span class="opt">obligatorio</span></label>
                <input class="input" type="number" step="0.01" min="0" max="100" formControlName="igvPorcentaje" />
              </div>
              <div class="switch-row">
                <label class="switch">
                  <input type="checkbox" formControlName="precioIncluyeIGV" />
                  <span class="track"></span>
                </label>
                <div>
                  <b>Los precios de productos incluyen IGV</b>
                  <small>Si está activo, el IGV se desglosa de los precios de venta</small>
                </div>
              </div>
              <button class="btn btn-primary w-full mt-12" [disabled]="saving()" (click)="save()">
                @if (saving()) { <span class="spinner"></span> Guardando… } @else { <app-icon name="save" [size]="16" /> Guardar impuestos }
              </button>
            </form>
          </section>

          <section class="config-card">
            <div class="config-card-head">
              <span class="avatar soft"><app-icon name="building" [size]="18" /></span>
              <div>
                <h2>Datos del negocio</h2>
                <small>Se usan para identificar tu empresa en los comprobantes</small>
              </div>
            </div>
            <form [formGroup]="empresaForm" novalidate>
              <div class="form-grid">
                <div class="field">
                  <label class="label">Razón social</label>
                  <input class="input" formControlName="razonSocial" />
                </div>
                <div class="field">
                  <label class="label">RUC</label>
                  <input class="input" formControlName="ruc" />
                </div>
                <div class="field full">
                  <label class="label">Dirección</label>
                  <input class="input" formControlName="direccion" />
                </div>
                <div class="field">
                  <label class="label">Teléfono</label>
                  <input class="input" formControlName="telefono" />
                </div>
                <div class="field">
                  <label class="label">Email</label>
                  <input class="input" type="email" formControlName="email" />
                </div>
              </div>
              <button class="btn btn-primary w-full mt-12" [disabled]="saving()" (click)="save()">
                @if (saving()) { <span class="spinner"></span> Guardando… } @else { <app-icon name="save" [size]="16" /> Guardar datos }
              </button>
            </form>
          </section>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .config-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
        gap: 16px;
        align-items: start;
      }
      .config-card {
        background: #fff;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .config-card-head {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .config-card-head h2 {
        font-size: 15px;
      }
      .config-card-head small {
        color: var(--text-faint);
        font-size: 12px;
      }
      .switch-row {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 12px 14px;
        margin-top: 12px;
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
      .mt-12 {
        margin-top: 12px;
      }
    `,
  ],
})
export class ConfiguracionComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy = inject(DestroyRef);

  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly impuestosForm = this.fb.nonNullable.group({
    igvPorcentaje: [18, [Validators.required, Validators.min(0), Validators.max(100)]],
    precioIncluyeIGV: [true],
  });

  readonly empresaForm = this.fb.nonNullable.group({
    razonSocial: [''],
    ruc: [''],
    direccion: [''],
    telefono: [''],
    email: [''],
  });

  ngOnInit() {
    this.api
      .configuracion()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((c: ConfiguracionResponse) => {
        this.impuestosForm.patchValue({ igvPorcentaje: c.igvPorcentaje, precioIncluyeIGV: c.precioIncluyeIGV });
        this.empresaForm.patchValue({
          razonSocial: c.razonSocial,
          ruc: c.ruc,
          direccion: c.direccion,
          telefono: c.telefono,
          email: c.email,
        });
        this.loading.set(false);
      });
  }

  save() {
    if (this.impuestosForm.invalid) {
      this.impuestosForm.markAllAsTouched();
      return;
    }
    const i = this.impuestosForm.getRawValue();
    const e = this.empresaForm.getRawValue();
    this.saving.set(true);
    this.api
      .actualizarConfiguracion({
        igvPorcentaje: i.igvPorcentaje,
        precioIncluyeIGV: i.precioIncluyeIGV,
        razonSocial: e.razonSocial || undefined,
        ruc: e.ruc || undefined,
        direccion: e.direccion || undefined,
        telefono: e.telefono || undefined,
        email: e.email || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Configuración guardada');
        },
        error: (e) => {
          this.saving.set(false);
          this.toast.error(errorMessage(e));
        },
      });
  }
}
