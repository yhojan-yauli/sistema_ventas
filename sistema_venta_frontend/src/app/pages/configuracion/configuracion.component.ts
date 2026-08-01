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

          <section class="config-card">
            <div class="config-card-head">
              <span class="avatar soft"><app-icon name="mail" [size]="18" /></span>
              <div>
                <h2>Correo (SMTP)</h2>
                <small>Cuenta desde la que se envían los comprobantes por correo</small>
              </div>
            </div>
            <form [formGroup]="smtpForm" novalidate>
              <div class="form-grid">
                <div class="field">
                  <label class="label">Servidor SMTP</label>
                  <input class="input" formControlName="smtpHost" placeholder="smtp.gmail.com" />
                </div>
                <div class="field">
                  <label class="label">Puerto</label>
                  <input class="input" type="number" formControlName="smtpPort" placeholder="587" />
                </div>
                <div class="field full">
                  <label class="label">Usuario</label>
                  <input class="input" type="email" formControlName="smtpUsername" placeholder="tucorreo@gmail.com" />
                </div>
                <div class="field full">
                  <label class="label">Contraseña de aplicación</label>
                  <input class="input" type="password" formControlName="smtpPassword" placeholder="Contraseña de aplicación de Gmail" />
                </div>
              </div>
              <div class="mt-12">
                <p class="hint">Para Gmail: activa la verificación en 2 pasos y genera una contraseña de aplicación de 16 caracteres.</p>
              </div>
              <div class="btn-row mt-12">
                <button class="btn btn-outline" [disabled]="testing() || saving()" (click)="probar()">
                  @if (testing()) { <span class="spinner"></span> Enviando… } @else { <app-icon name="mail" [size]="16" /> Probar envío }
                </button>
                <button class="btn btn-primary" [disabled]="testing() || saving()" (click)="save()">
                  @if (saving()) { <span class="spinner"></span> Guardando… } @else { <app-icon name="save" [size]="16" /> Guardar correo }
                </button>
              </div>
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
      .btn-row {
        display: flex;
        gap: 8px;
      }
      .btn-row .btn {
        flex: 1;
      }
      .hint {
        color: var(--text-faint);
        font-size: 12px;
        line-height: 1.45;
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
  readonly testing = signal(false);

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

  readonly smtpForm = this.fb.nonNullable.group({
    smtpHost: ['smtp.gmail.com'],
    smtpPort: ['587'],
    smtpUsername: [''],
    smtpPassword: [''],
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
        this.smtpForm.patchValue({
          smtpHost: c.smtpHost || 'smtp.gmail.com',
          smtpPort: c.smtpPort || '587',
          smtpUsername: c.smtpUsername || '',
          smtpPassword: c.smtpPassword || '',
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
    const s = this.smtpForm.getRawValue();
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
        smtpHost: s.smtpHost || undefined,
        smtpPort: s.smtpPort || undefined,
        smtpUsername: s.smtpUsername || undefined,
        smtpPassword: s.smtpPassword || undefined,
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

  probar() {
    const s = this.smtpForm.getRawValue();
    const para = (s.smtpUsername || '').trim();
    if (!para) {
      this.toast.error('Ingresa tu correo en Usuario antes de probar');
      return;
    }
    this.testing.set(true);
    this.api
      .enviarCorreo({
        para,
        asunto: 'Prueba SMTP',
        cuerpo: 'Este es un correo de prueba desde el sistema de ventas.\nSi lo ves en tu bandeja, la configuración SMTP es correcta.',
      })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.testing.set(false);
          this.toast.success(`Correo de prueba enviado a ${para}`);
        },
        error: (e) => {
          this.testing.set(false);
          this.toast.error(errorMessage(e));
        },
      });
  }
}
