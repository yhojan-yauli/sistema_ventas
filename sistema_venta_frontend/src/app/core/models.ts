export type Rol = 'ADMIN' | 'VENDEDOR';
export type TipoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTRO';
export type TipoComprobante = 'BOLETA' | 'FACTURA' | 'TICKET';
export type TipoDocumento = 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
export type TipoMovimientoStock = 'ENTRADA' | 'SALIDA';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  nombre: string;
  rol: Rol;
}

export interface MeResponse {
  id: number;
  username: string;
  nombre: string;
  email: string | null;
  rol: Rol;
  activo: boolean;
}

export interface UsuarioRequest {
  username: string;
  password?: string;
  nombre: string;
  email?: string;
  rol: Rol;
}

export interface UsuarioResponse {
  id: number;
  username: string;
  nombre: string;
  email: string | null;
  rol: Rol;
  activo: boolean;
  fechaCreacion: string;
}

export interface CajaRequest {
  nombre: string;
  descripcion?: string;
  activa?: boolean;
}

export interface CajaResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  fechaCreacion: string;
  saldo: number;
  fechaUltimoCierre: string | null;
}

export interface CategoriaRequest {
  nombre: string;
}

export interface CategoriaResponse {
  id: number;
  nombre: string;
}

export interface ProductoRequest {
  codigo?: string;
  nombre: string;
  categoriaId?: number | null;
  descripcion?: string;
  precioCompra: number;
  precioVenta: number;
  incluyeIGV?: boolean;
  stock?: number;
  stockMinimo?: number;
  ventaPorPeso?: boolean;
  pesoGramos?: number | null;
  activo?: boolean;
}

export interface ProductoResponse {
  id: number;
  codigo: string | null;
  nombre: string;
  categoriaId: number | null;
  categoriaNombre: string | null;
  descripcion: string | null;
  precioCompra: number;
  precioVenta: number;
  incluyeIGV: boolean;
  stock: number;
  stockMinimo: number;
  ventaPorPeso: boolean;
  pesoGramos: number | null;
  activo: boolean;
}

export interface AjusteStockRequest {
  cantidad: number;
  motivo?: string;
}

export interface MovimientoStockResponse {
  id: number;
  productoId: number;
  tipo: TipoMovimientoStock;
  cantidad: number;
  motivo: string | null;
  fecha: string;
}

export interface ProveedorRequest {
  razonSocial: string;
  ruc?: string;
  telefono?: string;
  direccion?: string;
  email?: string;
}

export interface ProveedorResponse {
  id: number;
  razonSocial: string;
  ruc: string | null;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
}

export interface ClienteRequest {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  razonSocial: string;
  telefono?: string;
  direccion?: string;
  email?: string;
}

export interface ClienteResponse {
  id: number;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  razonSocial: string;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
}

export interface ClienteConsultaResponse {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  razonSocial: string;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
  local: boolean;
}

export interface ItemCompraRequest {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
}

export interface ItemCompraResponse {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface CompraRequest {
  proveedorId: number;
  numeroDocumento?: string;
  fecha?: string;
  items: ItemCompraRequest[];
}

export interface CompraResponse {
  id: number;
  proveedorId: number;
  proveedorNombre: string;
  fecha: string;
  numeroDocumento: string | null;
  total: number;
  items: ItemCompraResponse[];
}

export interface ConfiguracionRequest {
  igvPorcentaje: number;
  precioIncluyeIGV: boolean;
  razonSocial?: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface ConfiguracionResponse {
  igvPorcentaje: number;
  precioIncluyeIGV: boolean;
  razonSocial: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface GastoRequest {
  concepto: string;
  monto: number;
  tipoPago?: TipoPago;
}

export interface GastoResponse {
  id: number;
  sesionId: number;
  concepto: string;
  monto: number;
  tipoPago: TipoPago | null;
  fecha: string;
}

export interface RetiroRequest {
  monto: number;
  tipoPago?: TipoPago;
  motivo?: string;
}

export interface RetiroResponse {
  id: number;
  sesionId: number;
  usuarioId: number;
  usuarioNombre: string;
  monto: number;
  tipoPago: TipoPago | null;
  motivo: string | null;
  fecha: string;
}

export interface CuadreMetodoRequest {
  tipoPago: TipoPago;
  montoReal: number | null;
}

export interface CuadreMetodoResponse {
  tipoPago: TipoPago;
  montoEsperado: number;
  montoReal: number;
  diferencia: number;
}

export interface AbrirSesionRequest {
  cajaId: number;
  montoInicial?: number;
  observaciones?: string;
}

export interface CerrarSesionRequest {
  observaciones?: string;
  cuadre: CuadreMetodoRequest[];
}

export interface SesionResponse {
  id: number;
  cajaId: number;
  cajaNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  fechaApertura: string;
  fechaCierre: string | null;
  montoInicial: number;
  estado: 'ABIERTA' | 'CERRADA';
  observaciones: string | null;
  totalVentas: number;
  totalGastos: number;
  totalRetiros: number;
  montoFinalEsperado: number;
  ventasPorMetodo: Record<string, number>;
  cuadre: CuadreMetodoResponse[];
  gastos: GastoResponse[];
  retiros: RetiroResponse[];
}

export interface ItemVentaRequest {
  productoId: number;
  cantidad: number;
  descuento?: number | null;
}

export interface ItemVentaResponse {
  productoId: number;
  productoNombre: string;
  productoCodigo: string | null;
  cantidad: number;
  precioVenta: number;
  precioCompra: number;
  pesoGramos: number | null;
  descuentoLinea: number;
  subtotal: number;
  ganancia: number;
}

export interface VentaRequest {
  clienteId?: number | null;
  clienteNuevo?: ClienteRequest | null;
  tipoPago: TipoPago;
  tipoComprobante: TipoComprobante;
  descuento?: number | null;
  items: ItemVentaRequest[];
}

export interface VentaResponse {
  id: number;
  sesionId: number;
  cajaId: number;
  cajaNombre: string;
  vendedorId: number;
  vendedorNombre: string;
  clienteId: number | null;
  clienteNombre: string | null;
  clienteDocumento: string | null;
  tipoPago: TipoPago;
  tipoComprobante: TipoComprobante;
  serie: string;
  numero: number;
  fecha: string;
  subtotal: number;
  descuento: number;
  igv: number;
  total: number;
  igvPorcentaje: number;
  incluyeIGV: boolean;
  items: ItemVentaResponse[];
}

export interface DashboardResponse {
  ventasHoy: number;
  ventasHoyCantidad: number;
  gananciaHoy: number;
  sesionesAbiertas: number;
  stockBajo: number;
  ventasDelMes: number;
}

export interface GrupoVenta {
  grupo: string;
  cantidad: number;
  total: number;
  igv: number;
  descuento: number;
}

export interface ProductoVendido {
  productoId: number;
  nombre: string;
  codigo: string | null;
  cantidad: number;
  subtotal: number;
  ganancia: number;
  precioCompra: number;
  precioVenta: number;
  margen: number | null;
  ventaPorPeso: boolean;
}

export interface StockReport {
  id: number;
  codigo: string | null;
  nombre: string;
  categoriaNombre: string | null;
  stock: number;
  stockMinimo: number;
  precioCompra: number;
  precioVenta: number;
  ventaPorPeso: boolean;
  pesoGramos: number | null;
  costoInventario: number;
  ventaInventario: number;
  margen: number | null;
}

export interface VentaResumen {
  cantidad: number;
  total: number;
  igv: number;
  subtotal: number;
  descuento: number;
  ganancia: number;
}

export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
  errors?: Record<string, string>;
}
