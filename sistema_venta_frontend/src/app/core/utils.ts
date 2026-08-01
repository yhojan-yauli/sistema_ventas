import { HttpErrorResponse } from '@angular/common/http';

const nf = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});

const nf0 = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function money(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'S/ 0.00';
  return nf.format(value);
}

export function number0(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return nf0.format(value);
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function date(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function fechaInput(fecha: string): string {
  return fecha ? fecha.slice(0, 10) : '';
}

export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No se pudo conectar con el servidor.';
    const body = err.error;
    if (body && body.message) return body.message;
    if (err.status === 401) return 'No autenticado. Inicie sesión nuevamente.';
    if (err.status === 403) return 'No tiene permisos para esta operación.';
  }
  return 'Ocurrió un error inesperado.';
}

export function errorField(err: unknown, field: string): string | undefined {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { errors?: Record<string, string> } | null;
    if (body?.errors) return body.errors[field];
  }
  return undefined;
}

export const TIPOS_PAGO: { value: string; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'OTRO', label: 'Otro' },
];

export const TIPOS_COMPROBANTE: { value: string; label: string }[] = [
  { value: 'BOLETA', label: 'Boleta' },
  { value: 'FACTURA', label: 'Factura' },
  { value: 'TICKET', label: 'Ticket' },
];

export const TIPOS_DOCUMENTO: { value: string; label: string }[] = [
  { value: 'DNI', label: 'DNI' },
  { value: 'RUC', label: 'RUC' },
  { value: 'CE', label: 'Carné de extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
];

export const ROLES: { value: string; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'VENDEDOR', label: 'Vendedor' },
];

export function tipoPagoLabel(value: string | null | undefined): string {
  return TIPOS_PAGO.find((t) => t.value === value)?.label ?? value ?? '—';
}

export function tipoComprobanteLabel(value: string | null | undefined): string {
  return TIPOS_COMPROBANTE.find((t) => t.value === value)?.label ?? value ?? '—';
}

export function rolLabel(value: string | null | undefined): string {
  return ROLES.find((t) => t.value === value)?.label ?? value ?? '—';
}
