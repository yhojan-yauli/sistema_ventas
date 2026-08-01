import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VentaRequest, VentaResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly http = inject(HttpClient);

  crear(body: VentaRequest): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(`${environment.apiUrl}/ventas`, body);
  }
  misVentas(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${environment.apiUrl}/ventas/mias`);
  }
  ventas(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${environment.apiUrl}/ventas`);
  }
  comprobante(serie: string, numero: number): Observable<VentaResponse> {
    return this.http.get<VentaResponse>(`${environment.apiUrl}/ventas/comprobante/${serie}/${numero}`);
  }
}
