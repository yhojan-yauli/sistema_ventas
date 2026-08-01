import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState extends Required<Omit<ConfirmOptions, 'message'>> {
  message: string;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly state = signal<ConfirmState | null>(null);
  readonly current = this.state.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({
        title: options.title ?? 'Confirmar acción',
        message: options.message,
        confirmText: options.confirmText ?? 'Confirmar',
        cancelText: options.cancelText ?? 'Cancelar',
        danger: options.danger ?? false,
        resolve,
      });
    });
  }

  accept() {
    this.state()?.resolve(true);
    this.state.set(null);
  }

  cancel() {
    this.state()?.resolve(false);
    this.state.set(null);
  }
}
