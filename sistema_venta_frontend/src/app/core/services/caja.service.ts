import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AbrirSesionRequest,
  CajaRequest,
  CajaResponse,
  CerrarSesionRequest,
  GastoRequest,
  GastoResponse,
  RetiroRequest,
  RetiroResponse,
  SesionResponse,
  VentaResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly http = inject(HttpClient);

  cajas(): Observable<CajaResponse[]> {
    return this.http.get<CajaResponse[]>(`${environment.apiUrl}/cajas`);
  }
  cajasActivas(): Observable<CajaResponse[]> {
    return this.http.get<CajaResponse[]>(`${environment.apiUrl}/cajas/activas`);
  }
  crearCaja(body: CajaRequest): Observable<CajaResponse> {
    return this.http.post<CajaResponse>(`${environment.apiUrl}/cajas`, body);
  }
  actualizarCaja(id: number, body: CajaRequest): Observable<CajaResponse> {
    return this.http.put<CajaResponse>(`${environment.apiUrl}/cajas/${id}`, body);
  }
  eliminarCaja(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/cajas/${id}`);
  }

  // ---------- Sesiones ----------
  abrirSesion(body: AbrirSesionRequest): Observable<SesionResponse> {
    return this.http.post<SesionResponse>(`${environment.apiUrl}/sesiones/abrir`, body);
  }
  cerrarSesion(id: number, body: CerrarSesionRequest): Observable<SesionResponse> {
    return this.http.post<SesionResponse>(`${environment.apiUrl}/sesiones/${id}/cerrar`, body);
  }
  miSesion(): Observable<SesionResponse | null> {
    return this.http.get<SesionResponse | null>(`${environment.apiUrl}/sesiones/mi`);
  }
  sesion(id: number): Observable<SesionResponse> {
    return this.http.get<SesionResponse>(`${environment.apiUrl}/sesiones/${id}`);
  }
  sesionesActivas(): Observable<SesionResponse[]> {
    return this.http.get<SesionResponse[]>(`${environment.apiUrl}/sesiones/activas`);
  }
  historialSesiones(): Observable<SesionResponse[]> {
    return this.http.get<SesionResponse[]>(`${environment.apiUrl}/sesiones/historial`);
  }

  // ---------- Gastos ----------
  gastos(sesionId: number): Observable<GastoResponse[]> {
    return this.http.get<GastoResponse[]>(`${environment.apiUrl}/sesiones/${sesionId}/gastos`);
  }
  crearGasto(sesionId: number, body: GastoRequest): Observable<GastoResponse> {
    return this.http.post<GastoResponse>(`${environment.apiUrl}/sesiones/${sesionId}/gastos`, body);
  }
  eliminarGasto(sesionId: number, gastoId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/sesiones/${sesionId}/gastos/${gastoId}`);
  }

  // ---------- Retiros ----------
  retiros(sesionId: number): Observable<RetiroResponse[]> {
    return this.http.get<RetiroResponse[]>(`${environment.apiUrl}/sesiones/${sesionId}/retiros`);
  }
  crearRetiro(sesionId: number, body: RetiroRequest): Observable<RetiroResponse> {
    return this.http.post<RetiroResponse>(`${environment.apiUrl}/sesiones/${sesionId}/retiros`, body);
  }

  // ---------- Ventas por sesión ----------
  ventasPorSesion(sesionId: number): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${environment.apiUrl}/ventas/sesion/${sesionId}`);
  }
}
