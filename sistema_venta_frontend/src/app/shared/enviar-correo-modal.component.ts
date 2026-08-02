import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VentaResponse } from '../core/models';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { errorMessage, tipoComprobanteLabel } from '../core/utils';
import { IconComponent } from './icon.component';
import { ModalComponent, ModalFooterDirective } from './modal.component';

@Component({
  selector: 'app-enviar-correo-modal',
  standalone: true,
  imports: [ModalComponent, ModalFooterDirective, IconComponent],
  template: `
    <app-modal [open]="abierto() && !!venta()" (closed)="cerrado.emit()" size="md">
      @if (venta(); as v) {
        <span head>Enviar por correo</span>
      }
      @if (venta(); as v) {
        <div class="em-body">
          <p class="muted mb-12">
            Se enviará <b>{{ comprobante(v) }}</b> con la boleta adjunta en PDF (A4, formato SUNAT), desde la cuenta configurada en <b>Configuración → Correo</b>.
          </p>
          <div class="field mb-12">
            <label class="label">Para <span class="opt">obligatorio</span></label>
            <input class="input" type="email" [value]="para()" (input)="para.set($any($event.target).value)" placeholder="cliente@correo.com" />
          </div>
          <div class="field mb-12">
            <label class="label">Asunto</label>
            <input class="input" [value]="asunto(v)" readonly />
          </div>
          <div class="field">
            <label class="label">Mensaje <span class="opt">opcional</span></label>
            <textarea class="textarea" rows="5" [value]="mensaje()" (input)="mensaje.set($any($event.target).value)" placeholder="Nota adicional para el cliente (opcional)"></textarea>
          </div>
        </div>
      }
      @if (venta(); as v) {
        <div foot>
          <button class="btn btn-ghost" (click)="cerrado.emit()">Cancelar</button>
          <button class="btn btn-primary" [disabled]="sending() || !para().trim()" (click)="enviar(v)">
            @if (sending()) { <span class="spinner"></span> Enviando… } @else { <app-icon name="mail" [size]="15" /> Enviar }
          </button>
        </div>
      }
    </app-modal>
  `,
  styles: [
    `
      .em-body {
        display: flex;
        flex-direction: column;
      }
      .mb-12 {
        margin-bottom: 12px;
      }
    `,
  ],
})
export class EnviarCorreoModalComponent {
  readonly abierto = input(false);
  readonly venta = input<VentaResponse | null>(null);
  readonly cerrado = output();

  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly destroy = inject(DestroyRef);

  readonly sending = signal(false);
  readonly para = signal('');
  readonly mensaje = signal('');

  constructor() {
    effect(() => {
      if (this.abierto()) {
        this.para.set(this.venta()?.clienteEmail ?? '');
        this.mensaje.set('');
      }
    });
  }

  comprobante(v: VentaResponse): string {
    return `${v.serie}-${String(v.numero).padStart(4, '0')}`;
  }

  asunto(v: VentaResponse): string {
    return `${tipoComprobanteLabel(v.tipoComprobante)} ${this.comprobante(v)}`;
  }

  enviar(v: VentaResponse) {
    const para = this.para().trim();
    if (!para || this.sending()) return;
    this.sending.set(true);
    this.api
      .enviarCorreo({ para, asunto: this.asunto(v), cuerpo: this.mensaje().trim() || null, ventaId: v.id })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.toast.success('Correo enviado');
          this.cerrado.emit();
        },
        error: (e) => {
          this.sending.set(false);
          this.toast.error(errorMessage(e));
        },
      });
  }
}
