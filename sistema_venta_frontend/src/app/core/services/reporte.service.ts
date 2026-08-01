import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DashboardResponse,
  GrupoVenta,
  ProductoVendido,
  TipoComprobante,
  TipoPago,
  VentaResumen,
  VentaResponse,
} from '../models';

export interface ReporteFiltros {
  desde?: string | null;
  hasta?: string | null;
  vendedorId?: number | null;
  productoId?: number | null;
  tipoPago?: TipoPago | null;
  tipoComprobante?: TipoComprobante | null;
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);

  private params(f: ReporteFiltros): HttpParams {
    let p = new HttpParams();
    const set = (k: string, v: unknown) => {
      if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
    };
    set('desde', f.desde);
    set('hasta', f.hasta);
    set('vendedorId', f.vendedorId);
    set('productoId', f.productoId);
    set('tipoPago', f.tipoPago);
    set('tipoComprobante', f.tipoComprobante);
    return p;
  }

  resumen(f: ReporteFiltros = {}): Observable<VentaResumen> {
    return this.http.get<VentaResumen>(`${environment.apiUrl}/reportes/resumen`, { params: this.params(f) });
  }
  ventas(f: ReporteFiltros = {}): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${environment.apiUrl}/reportes/ventas`, { params: this.params(f) });
  }
  porProducto(f: ReporteFiltros = {}): Observable<ProductoVendido[]> {
    return this.http.get<ProductoVendido[]>(`${environment.apiUrl}/reportes/por-producto`, { params: this.params(f) });
  }
  porVendedor(f: ReporteFiltros = {}): Observable<GrupoVenta[]> {
    return this.http.get<GrupoVenta[]>(`${environment.apiUrl}/reportes/por-vendedor`, { params: this.params(f) });
  }
  porFecha(f: ReporteFiltros = {}): Observable<GrupoVenta[]> {
    return this.http.get<GrupoVenta[]>(`${environment.apiUrl}/reportes/por-fecha`, { params: this.params(f) });
  }
  porTipoPago(f: ReporteFiltros = {}): Observable<GrupoVenta[]> {
    return this.http.get<GrupoVenta[]>(`${environment.apiUrl}/reportes/por-tipo-pago`, { params: this.params(f) });
  }
  porComprobante(f: ReporteFiltros = {}): Observable<GrupoVenta[]> {
    return this.http.get<GrupoVenta[]>(`${environment.apiUrl}/reportes/por-comprobante`, { params: this.params(f) });
  }
  dashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${environment.apiUrl}/reportes/dashboard`);
  }
}
