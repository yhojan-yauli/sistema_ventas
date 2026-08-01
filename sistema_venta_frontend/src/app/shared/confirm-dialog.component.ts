import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalComponent, ModalFooterDirective } from './modal.component';
import { ConfirmService } from '../core/services/confirm.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent, ModalFooterDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [open]="!!confirm.current()" (closed)="confirm.cancel()">
      <span head>@if (confirm.current(); as c) { {{ c.title }} }</span>
      <div class="confirm-body">
        <span class="confirm-icon" [class.danger]="confirm.current()?.danger">
          <app-icon name="alert" [size]="22" />
        </span>
        <p>@if (confirm.current(); as c) { {{ c.message }} }</p>
      </div>
      <div foot>
        <button class="btn btn-ghost" (click)="confirm.cancel()">
          @if (confirm.current(); as c) { {{ c.cancelText }} }
        </button>
        <button class="btn" [class.btn-danger]="confirm.current()?.danger" (click)="confirm.accept()">
          @if (confirm.current(); as c) { {{ c.confirmText }} }
        </button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .confirm-body {
        display: flex;
        align-items: flex-start;
        gap: 14px;
      }
      .confirm-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--brand-soft);
        color: var(--brand);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .confirm-icon.danger {
        background: var(--danger-soft);
        color: var(--danger);
      }
      .confirm-body p {
        line-height: 1.55;
        color: var(--text-soft);
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  constructor(readonly confirm: ConfirmService) {}
}
