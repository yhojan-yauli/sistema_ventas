import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ToastService } from '../core/services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts">
      @for (t of toast.list(); track t.id) {
        <div class="toast" [class.toast-error]="t.type === 'error'" [class.toast-warning]="t.type === 'warning'" [class.toast-info]="t.type === 'info'">
          <span class="toast-icon">
            <app-icon [name]="t.type === 'error' ? 'alert' : t.type === 'warning' ? 'alert' : t.type === 'info' ? 'info' : 'check'" [size]="18" />
          </span>
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close" (click)="toast.remove(t.id)" aria-label="Cerrar">
            <app-icon name="x" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toasts {
        position: fixed;
        top: 18px;
        right: 18px;
        z-index: 3000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 380px;
      }
      .toast {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        background: #fff;
        border: 1px solid var(--border);
        border-left: 4px solid var(--success);
        border-radius: var(--radius);
        padding: 12px 14px;
        box-shadow: var(--shadow-lg);
        animation: toast-in 0.22s ease;
      }
      .toast-error {
        border-left-color: var(--danger);
      }
      .toast-warning {
        border-left-color: var(--accent);
      }
      .toast-info {
        border-left-color: var(--info);
      }
      .toast-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--success-soft);
        color: var(--success);
        flex-shrink: 0;
      }
      .toast-error .toast-icon {
        background: var(--danger-soft);
        color: var(--danger);
      }
      .toast-warning .toast-icon {
        background: var(--accent-soft);
        color: #b45309;
      }
      .toast-info .toast-icon {
        background: var(--info-soft);
        color: var(--info);
      }
      .toast-msg {
        flex: 1;
        line-height: 1.45;
        color: var(--text);
        font-weight: 500;
      }
      .toast-close {
        border: 0;
        background: transparent;
        color: var(--text-faint);
        padding: 2px;
        display: flex;
        border-radius: 4px;
      }
      .toast-close:hover {
        color: var(--text);
        background: var(--bg);
      }
      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ToastContainerComponent {
  constructor(readonly toast: ToastService) {}
}
