import { Component, Directive, contentChild, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

@Directive({ selector: '[foot]' })
export class ModalFooterDirective {}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (open()) {
      <div class="backdrop" (mousedown)="onBackdrop($event)"></div>
      <div class="dialog" [class.dialog-lg]="size() === 'lg'" [class.dialog-xl]="size() === 'xl'" role="dialog" [attr.aria-modal]="'true'">
        <div class="dialog-head">
          <h3><ng-content select="[head]"></ng-content></h3>
          <button class="icon-btn" (click)="closed.emit()" aria-label="Cerrar">
            <app-icon name="x" [size]="20" />
          </button>
        </div>
        <div class="dialog-body"><ng-content></ng-content></div>
        @if (foot()) {
          <div class="dialog-foot"><ng-content select="[foot]"></ng-content></div>
        }
      </div>
    }
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(13, 26, 30, 0.5);
        backdrop-filter: blur(2px);
        z-index: 1000;
        animation: fade 0.18s ease;
      }
      .dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(520px, calc(100vw - 32px));
        max-height: calc(100vh - 48px);
        background: var(--surface);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        z-index: 1001;
        display: flex;
        flex-direction: column;
        animation: pop 0.2s ease;
        overflow: hidden;
      }
      .dialog-lg {
        width: min(760px, calc(100vw - 32px));
      }
      .dialog-xl {
        width: min(1120px, calc(100vw - 32px));
      }
      .dialog-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 18px 22px;
        border-bottom: 1px solid var(--border);
        background: var(--surface-soft);
      }
      .dialog-head h3 {
        font-size: 17px;
        font-weight: 800;
      }
      .dialog-body {
        padding: 22px;
        overflow-y: auto;
      }
      .dialog-foot {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 22px;
        border-top: 1px solid var(--border);
        background: var(--surface);
      }
      .icon-btn {
        border: 1px solid var(--border);
        background: #fff;
        border-radius: 8px;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-soft);
      }
      .icon-btn:hover {
        background: var(--bg);
        color: var(--text);
      }
      @keyframes fade {
        from {
          opacity: 0;
        }
      }
      @keyframes pop {
        from {
          opacity: 0;
          transform: translate(-50%, -48%) scale(0.97);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }
    `,
  ],
})
export class ModalComponent {
  readonly open = input(false);
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly closed = output();

  readonly foot = contentChild(ModalFooterDirective);

  onBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) this.closed.emit();
  }
}
