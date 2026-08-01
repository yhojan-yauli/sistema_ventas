import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AjusteStockRequest,
  CategoriaRequest,
  CategoriaResponse,
  ClienteRequest,
  ClienteResponse,
  CompraRequest,
  CompraResponse,
  ConfiguracionRequest,
  ConfiguracionResponse,
  MovimientoStockResponse,
  ProductoRequest,
  ProductoResponse,
  ProveedorRequest,
  ProveedorResponse,
  UsuarioRequest,
  UsuarioResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  protected readonly http = inject(HttpClient);

  // ---------- Categorías ----------
  categorias(): Observable<CategoriaResponse[]> {
    return this.http.get<CategoriaResponse[]>(`${environment.apiUrl}/categorias`);
  }
  crearCategoria(body: CategoriaRequest): Observable<CategoriaResponse> {
    return this.http.post<CategoriaResponse>(`${environment.apiUrl}/categorias`, body);
  }
  actualizarCategoria(id: number, body: CategoriaRequest): Observable<CategoriaResponse> {
    return this.http.put<CategoriaResponse>(`${environment.apiUrl}/categorias/${id}`, body);
  }
  eliminarCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/categorias/${id}`);
  }

  // ---------- Productos ----------
  productos(activos = true): Observable<ProductoResponse[]> {
    return this.http.get<ProductoResponse[]>(`${environment.apiUrl}/productos`, {
      params: { activos },
    });
  }
  buscarProductos(q: string): Observable<ProductoResponse[]> {
    return this.http.get<ProductoResponse[]>(`${environment.apiUrl}/productos/buscar`, {
      params: { q },
    });
  }
  stockBajo(): Observable<ProductoResponse[]> {
    return this.http.get<ProductoResponse[]>(`${environment.apiUrl}/productos/stock-bajo`);
  }
  movimientosProducto(id: number): Observable<MovimientoStockResponse[]> {
    return this.http.get<MovimientoStockResponse[]>(`${environment.apiUrl}/productos/${id}/movimientos`);
  }
  crearProducto(body: ProductoRequest): Observable<ProductoResponse> {
    return this.http.post<ProductoResponse>(`${environment.apiUrl}/productos`, body);
  }
  actualizarProducto(id: number, body: ProductoRequest): Observable<ProductoResponse> {
    return this.http.put<ProductoResponse>(`${environment.apiUrl}/productos/${id}`, body);
  }
  cambiarActivoProducto(id: number): Observable<ProductoResponse> {
    return this.http.patch<ProductoResponse>(`${environment.apiUrl}/productos/${id}/activo`, {});
  }
  ajustarStock(id: number, body: AjusteStockRequest): Observable<ProductoResponse> {
    return this.http.post<ProductoResponse>(`${environment.apiUrl}/productos/${id}/stock/ajuste`, body);
  }

  // ---------- Proveedores ----------
  proveedores(): Observable<ProveedorResponse[]> {
    return this.http.get<ProveedorResponse[]>(`${environment.apiUrl}/proveedores`);
  }
  crearProveedor(body: ProveedorRequest): Observable<ProveedorResponse> {
    return this.http.post<ProveedorResponse>(`${environment.apiUrl}/proveedores`, body);
  }
  actualizarProveedor(id: number, body: ProveedorRequest): Observable<ProveedorResponse> {
    return this.http.put<ProveedorResponse>(`${environment.apiUrl}/proveedores/${id}`, body);
  }

  // ---------- Clientes ----------
  clientes(q = ''): Observable<ClienteResponse[]> {
    return this.http.get<ClienteResponse[]>(`${environment.apiUrl}/clientes`, {
      params: q ? { q } : {},
    });
  }
  crearCliente(body: ClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(`${environment.apiUrl}/clientes`, body);
  }
  actualizarCliente(id: number, body: ClienteRequest): Observable<ClienteResponse> {
    return this.http.put<ClienteResponse>(`${environment.apiUrl}/clientes/${id}`, body);
  }

  // ---------- Usuarios ----------
  usuarios(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(`${environment.apiUrl}/usuarios`);
  }
  crearUsuario(body: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${environment.apiUrl}/usuarios`, body);
  }
  actualizarUsuario(id: number, body: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${environment.apiUrl}/usuarios/${id}`, body);
  }
  cambiarActivoUsuario(id: number): Observable<UsuarioResponse> {
    return this.http.patch<UsuarioResponse>(`${environment.apiUrl}/usuarios/${id}/activo`, {});
  }
  cambiarPassword(id: number, password: string): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/usuarios/${id}/password`, { password });
  }

  // ---------- Compras ----------
  compras(): Observable<CompraResponse[]> {
    return this.http.get<CompraResponse[]>(`${environment.apiUrl}/compras`);
  }
  crearCompra(body: CompraRequest): Observable<CompraResponse> {
    return this.http.post<CompraResponse>(`${environment.apiUrl}/compras`, body);
  }

  // ---------- Configuración ----------
  configuracion(): Observable<ConfiguracionResponse> {
    return this.http.get<ConfiguracionResponse>(`${environment.apiUrl}/configuracion`);
  }
  actualizarConfiguracion(body: ConfiguracionRequest): Observable<ConfiguracionResponse> {
    return this.http.put<ConfiguracionResponse>(`${environment.apiUrl}/configuracion`, body);
  }
}
